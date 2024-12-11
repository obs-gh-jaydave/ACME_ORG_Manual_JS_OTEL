import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

export async function initOtel() {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

    const traceExporter = new ConsoleSpanExporter();
    const metricReader = new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
    });

    const sdk = new NodeSDK({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: 'simple-api',
        }),
        contextManager: new AsyncLocalStorageContextManager().enable(),
        textMapPropagator: new W3CTraceContextPropagator(),
        traceExporter
       });

    await sdk.start();
    console.log('[simple-api] Tracing initialized');
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('Tracing terminated'))
            .catch((error) => console.error('Error terminating tracing', error))
            .finally(() => process.exit(0));
    });
}
