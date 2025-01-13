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

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run Service A (port 3000):**
   ```bash
   npx ts-node src/server.ts
   ```
3. **Run Service B (port 3001)**
   ```bash
   npx ts-node src/service-b/server.ts
   ```
4. **Test** via `http://localhost:3000/`, or visit in your browser. `Service A` calls `Service B` internally.

---

## Load Testing with Artillery

An example Artillery config (`otel-traceid-test/artillery.yml`) sends 1000 RPS to `http://localhost:3000/`. After 60 seconds, you’ll see a large number of requests/trace data:

```bash
cd otel-traceid-test
npx artillery run artillery.yml
```
**Service A** receives these requests, starts an **"incoming-request"** span, then calls **Service B** with a child **"outgoing-request"** span. **Service B** starts its own **"process-request"** span. All share the same `trace ID`.

--- 
## Verifying Distributed Traces
- OTLP Endpoint: If sending to a Collector or SaaS vendor, check their UI for a single trace ID covering:
	1.	`incoming-request` (Service A root)
	2.	`outgoing-request` (Service A child)
	3.	`process-request` (Service B child)

Each operation has the same `traceId`, forming a unified distributed trace.