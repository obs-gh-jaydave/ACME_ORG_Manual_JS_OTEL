# Minimal OpenTelemetry Manual Instrumentation Example (Updated)

This project demonstrates a minimal setup for **manual OpenTelemetry tracing** across **two Node.js services**—Service A and Service B—under concurrent load. It shows how to:

- Initialize the OpenTelemetry SDK without auto-instrumentation.
- Create spans for both **incoming** and **outgoing** requests.
- Propagate trace context across **service boundaries** (e.g., from Service A to Service B).
- Use Artillery for load testing to generate concurrent requests.

---

## Why Manual Instrumentation?

Manual instrumentation gives you **complete control** over span creation, parent-child relationships, and context propagation. It helps address issues like mismatched trace IDs, excessive spans, and missing parent-child links that can appear with auto-instrumentation.

---

## What This Example Shows

1. **Trace Context Extraction**: `propagation.extract()` in Express middleware to create an `"incoming-request"` span.
2. **Trace Context Injection**: `propagation.inject()` in outgoing requests (`"outgoing-request"` span).
3. **Multiple Services**: Service A (port 3000) makes an HTTP call to Service B (port 3001), continuing the same trace ID.
4. **Concurrent Load**: Artillery sends high-rate requests to Service A, which calls Service B, producing distributed traces.

---

## OpenTelemetry Initialization

- Uses `@opentelemetry/sdk-node` with an OTLP exporter (`OTLPTraceExporter`).
- Sets an `AsyncLocalStorageContextManager` for async context retention.
- Specifies a `W3CTraceContextPropagator` to handle `traceparent` headers.
- Points the trace exporter to `http://localhost:4318/v1/traces` (or your own endpoint).


---

## Running Both Services

1. **Terminal A** (Service A):
   ```bash
   cd path/to/this/project
   npm install
   npx ts-node src/server.ts
   ```
   - This starts `Service A` on **port 3000**
2. **Terminal B** (Service B):
   ```bash
   cd path/to/this/project
   npx ts-node src/service-b/server.ts
   ```
      - This starts `Service B` on **port 3001**
3. **Terminal C** (Artillery Load Test):
   ```bash
   cd path/to/this/project/otel-traceid-test
   npx artillery run artillery.yml
   ```
    - Sends high-rate GET requests (`/`) to `http://localhost:3000`.
4. **Confirm both services are running**
    - Service A log output: `Server listening on http://localhost:3000`
    - Service B log output: `Service B listening on http://localhost:3001`

4. **Test** the distributed trace flow:
   - Run the commands for **Terminal C** that will create the load  
   - `Service A` receives the request, creates an `incoming-request` span, calls `Service B`, which creates a `process-request` span. All share the same `trace ID`.

---

## OTEL Collector Configuration
1. Navigate to `src/otel-collector-config.yaml`
2. Update the configuration and replace:
   - `OBSERVE_TENANT`: your unique Observe tenant id 
   - `OBSERVE_TOKEN`: your unique Observe access token
  
Start the collector to listen and forward traces to Observe: 
```bash
docker run --rm -p 4317:4317 -p 4318:4318 \
  -v $(pwd)/otel-collector-config.yaml:/etc/otel-collector-config.yaml \
  otel/opentelemetry-collector:latest \
  --config=/etc/otel-collector-config.yaml
```
## Viewing Distributed Traces
- OTLP Endpoint: If sending to a Collector or Observe, check their UI for a single trace ID covering:
	1.	`incoming-request` (Service A root)
	2.	`outgoing-request` (Service A child)
	3.	`process-request` (Service B child)

Each operation has the same `traceId`, forming a unified distributed trace.