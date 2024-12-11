const http = require('http');
const fs = require('fs');
const { trace } = require('@opentelemetry/api');
const { BasicTracerProvider, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');

// Set up a basic tracer
const provider = new BasicTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();
const tracer = trace.getTracer('test-tracer');

// Keep track of seen traceIds and other metrics
const seenTraceIds = new Set();
let totalRequests = 0;
let duplicateFound = false;

// Create a write stream to log results to a local file
const logFile = fs.createWriteStream('trace-results.log', { flags: 'a' });

// Helper function to log to both console and file
function logMessage(message) {
  console.log(message);
  logFile.write(message + '\n');
}

// Handle shutdown gracefully to print summary
function shutdown() {
  logMessage('--- Summary of Run ---');
  logMessage(`Total requests processed: ${totalRequests}`);
  logMessage(`Duplicate trace IDs encountered: ${duplicateFound ? 'Yes' : 'No'}`);
  logMessage('----------------------');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const server = http.createServer((req, res) => {
  totalRequests++;

  const span = tracer.startSpan('incoming-request');
  const spanContext = span.spanContext();
  const traceId = spanContext.traceId;

  // Check for duplicate traceId
  if (seenTraceIds.has(traceId)) {
    duplicateFound = true;
    const errorMsg = `Duplicate traceId detected: ${traceId}. Exiting...`;
    logMessage(errorMsg);

    span.end();
    res.statusCode = 500;
    res.end('Duplicate Trace ID Detected');

    // Log final summary before exiting
    shutdown();
  } else {
    seenTraceIds.add(traceId);
  }

  const requestMsg = `Incoming request traceId: ${traceId}, spanId: ${spanContext.spanId}`;
  logMessage(requestMsg);

  span.end();
  res.end('OK');
});

server.listen(3000, () => {
  logMessage('Server listening on port 3000');
});
