
# Minimal OpenTelemetry Manual Instrumentation Example

This project demonstrates a minimal, end-to-end setup of manual OpenTelemetry tracing for a Node.js/Express service. It provides an easy-to-follow pattern for:

- Initializing the OpenTelemetry SDK without auto-instrumentation.
- Creating parent-child spans for both incoming and outgoing requests.
- Propagating trace context across service boundaries.

## Why Manual Instrumentation?

Manual instrumentation gives you complete control over how spans are created, parented, and ended. Unlike auto-instrumentation, which can sometimes produce unexpected spans or incorrect parent-child relationships, manual instrumentation ensures that every span is intentional and that trace context is handled precisely as needed.

This approach is especially useful if you’ve encountered issues with:

- Trace IDs not matching between services.
- Excessive spans generated under load.
- Missing or incorrect parent-child relationships between spans.

## What This Example Shows

### 1. Initializing OpenTelemetry Without Auto-Instrumentation

The `initOtel()` function in `otel_instrumentation.ts` sets up the OpenTelemetry SDK. It:

- Uses an `AsyncLocalStorageContextManager` for maintaining context across asynchronous calls.
- Sets a `W3CTraceContextPropagator` to ensure `traceparent` and `tracestate` headers are properly handled.
- Configures a `ConsoleSpanExporter` so you can see spans printed directly to the console.

### 2. Manually Creating Incoming Request Spans

In `server.ts`:

- An Express middleware extracts the trace context from incoming request headers using `propagation.extract()`.
- A new `incoming-request` span is started, parented by the extracted context if present.
- The span remains active for the entire lifecycle of the request/response.
- When the response finishes, the `incoming-request` span is ended, accurately representing the request’s duration and status code.

### 3. Manual Outgoing HTTP Request Instrumentation

The `doOutgoingRequest()` function:

- Retrieves the current active context.
- Starts a new `outgoing-request` span as a child of the `incoming-request` span.
- Injects the trace context into the outgoing request headers, allowing downstream services to continue the trace.
- Ends the child span after receiving a response.

### 4. Demonstrating Trace Relationships

Run the server and send a request to `/`. In the console, you’ll see the `incoming-request` and `outgoing-request` spans sharing the same `trace_id`. This confirms that the trace context is propagated properly, linking all related spans into a single distributed trace.

## Expected Output

When you run `npm start` and then send a request (for example, `curl http://localhost:3000/`), you should see console output like this:

```json
{
  "resource": { ... },
  "instrumentationScope": { "name": "simple-api", "version": "1.0.0" },
  "traceId": "ec7731a030df208e353a27d31d1dac31",
  "parentId": "a7d8e4719bfeb78c",
  "name": "outgoing-request",
  "id": "40f3a6d18796c1b4",
  "attributes": {
    "http.url": "http://worldtimeapi.org/api/timezone/Etc/UTC",
    "http.status_code": 200
  }
}
{
  "resource": { ... },
  "instrumentationScope": { "name": "simple-api", "version": "1.0.0" },
  "traceId": "ec7731a030df208e353a27d31d1dac31",
  "parentId": undefined,
  "name": "incoming-request",
  "id": "a7d8e4719bfeb78c",
  "attributes": { "http.status_code": 200 }
}
```

HOW THIS WORKS:

- The `incoming-request` span is created when the request first arrives.
- Since there's no parent trace context provided, `incoming-request` acts as the root span (parentId = undefined).
- When the application makes a downstream call, it starts a new `outgoing-request` span.
- `outgoing-request` inherits the `traceId` from the `incoming-request` span, ensuring both share the same `traceId`.
- The `parentId` of `outgoing-request` is the `id` of `incoming-request`, making it a proper child in the trace hierarchy.
- Both spans end once their respective operations complete, and they are then displayed in the console by the `ConsoleSpanExporter`.

This output shows two spans:  
- The **incoming-request** span representing the entire request lifecycle within this service.
- The **outgoing-request** span representing a downstream HTTP call made during the request.

Notice that both share the same `traceId` (`ec7731a030df208e353a27d31d1dac31`). The `incoming-request` span was created first, and the `outgoing-request` span became its child by using the active context and `traceId`. This ensures that all related operations are tied together under one distributed trace.

## How This Helps With Mapbox’s Problem

Mapbox has been experiencing issues with automatic instrumentation causing mismatched trace IDs and excessive spans. By following this example:

- He can manually extract context from incoming requests.
- Create manual spans for incoming and outgoing requests.
- Inject the context into outgoing requests so that downstream services preserve the same trace ID.

This approach ensures correct parent-child relationships, consistent trace IDs, and proper propagation under load or complex conditions.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Server:**
   ```bash
   npm start
   ```

3. **Send a Request:**
   ```bash
   curl http://localhost:3000/
   ```

Check the console output to verify that both `incoming-request` and `outgoing-request` spans share the same `trace_id`.