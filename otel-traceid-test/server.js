// const http = require('http');
// const fs = require('fs');
// const { trace } = require('@opentelemetry/api');
// const { NodeSDK } = require('@opentelemetry/sdk-node');
// const { Resource } = require('@opentelemetry/resources');
// const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
// const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
// const { AsyncLocalStorageContextManager } = require('@opentelemetry/context-async-hooks');
// const { W3CTraceContextPropagator } = require('@opentelemetry/core');
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// // Keep track of seen traceIds and other metrics
// const seenTraceIds = new Set();
// let totalRequests = 0;
// let duplicateFound = false;

// // Create a write stream to log results to a local file
// const logFile = fs.createWriteStream('trace-results.log', { flags: 'a' });

// // Helper function to log to both console and file
// function logMessage(message) {
//   console.log(message);
//   logFile.write(message + '\n');
// }

// async function initOtel() {
//     diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

//     const traceExporter = new OTLPTraceExporter({
//         url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
//         headers: {
//             Authorization: `Bearer ${process.env.OTEL_EXPORTER_AUTH || ''}`,
//         },
//         timeoutMillis: 15000,
//         onError: (error) => {
//             console.error('Trace export error:', error);
//         },
//     });

//     const sdk = new NodeSDK({
//         resource: new Resource({
//             [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'simple-api',
//         }),
//         contextManager: new AsyncLocalStorageContextManager().enable(),
//         textMapPropagator: new W3CTraceContextPropagator(),
//         traceExporter,
//     });

//     await sdk.start();
//     console.log('[simple-api] Tracing initialized');
    
//     return sdk;
// }

// // Handle shutdown gracefully to print summary
// async function shutdown(sdk) {
//   logMessage('--- Summary of Run ---');
//   logMessage(`Total requests processed: ${totalRequests}`);
//   logMessage(`Duplicate trace IDs encountered: ${duplicateFound ? 'Yes' : 'No'}`);
//   logMessage('----------------------');
  
//   if (sdk) {
//     try {
//       await sdk.shutdown();
//       console.log('Tracing terminated');
//     } catch (error) {
//       console.error('Error terminating tracing', error);
//     }
//   }
  
//   process.exit(0);
// }

// async function startServer() {
//     const sdk = await initOtel();
//     const tracer = trace.getTracer('http-server');

//     process.on('SIGINT', () => shutdown(sdk));
//     process.on('SIGTERM', () => shutdown(sdk));

//     const server = http.createServer((req, res) => {
//         totalRequests++;

//         const span = tracer.startSpan('incoming-request');
//         const spanContext = span.spanContext();
//         const traceId = spanContext.traceId;

//         // Check for duplicate traceId
//         if (seenTraceIds.has(traceId)) {
//             duplicateFound = true;
//             const errorMsg = `Duplicate traceId detected: ${traceId}. Exiting...`;
//             logMessage(errorMsg);

//             span.end();
//             res.statusCode = 500;
//             res.end('Duplicate Trace ID Detected');

//             // Log final summary before exiting
//             shutdown(sdk);
//         } else {
//             seenTraceIds.add(traceId);
//         }

//         const requestMsg = `Incoming request traceId: ${traceId}, spanId: ${spanContext.spanId}`;
//         logMessage(requestMsg);

//         span.end();
//         res.end('OK');
//     });

//     server.listen(3000, () => {
//         logMessage('Server listening on port 3000');
//     });
// }

// startServer().catch(error => {
//     console.error('Failed to start server:', error);
//     process.exit(1);
// });