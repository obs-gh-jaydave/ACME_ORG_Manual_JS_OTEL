import express, { Request, Response, NextFunction } from 'express';
import { initOtel } from '../otel_instrumentation';
import { context, trace, propagation } from '@opentelemetry/api';

async function main() {
    await initOtel();

    const app = express();

    const tracer = trace.getTracer('service-b', '1.0.0');

    app.use((req: Request, res: Response, next: NextFunction) => {
        const extractedContext = propagation.extract(context.active(), req.headers);
        const span = tracer.startSpan('process-request', {}, extractedContext);

        const incomingContext = trace.setSpan(extractedContext, span);

        res.on('finish', () => {
            span.setAttribute('http.status_code', res.statusCode);
            span.end();
        });

        context.with(incomingContext, () => {
            next();
        });
    });

    app.get('/process', (req: Request, res: Response) => {
        const span = trace.getActiveSpan();
        span?.addEvent('Processing request in Service B');
        res.send({ message: 'Service B processed request' });
    });

    app.listen(3001, () => {
        console.log('Service B listening on http://localhost:3001');
    });
}

main().catch(console.error);