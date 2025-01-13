import express, { Request, Response, NextFunction } from 'express';
import { initOtel } from './otel_instrumentation';
import { context, trace, propagation } from '@opentelemetry/api';
import { doOutgoingRequest } from './utils';

async function main() {
    await initOtel();

    const app = express();

    const tracer = trace.getTracer('simple-api', '1.0.0');

    // Incoming request middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
        // Extract parent context (if any) from the incoming headers
        const extractedContext = propagation.extract(context.active(), req.headers);
        const span = tracer.startSpan('incoming-request', {}, extractedContext);

        // Set the current span as active
        const incomingContext = trace.setSpan(extractedContext, span);

        res.on('finish', () => {
            span.setAttribute('http.status_code', res.statusCode);
            span.end();
        });

        context.with(incomingContext, () => {
            next();
        });
    });

    app.get('/', async (req: Request, res: Response) => {
        try {
            // Call downstream service (Service B)
            const { body } = await doOutgoingRequest({ url: 'http://localhost:3001/process' });
            res.send({ message: 'Service A', downstream: JSON.parse(body) });
        } catch (error) {
            res.status(500).send({ error: 'Failed to fetch downstream data' });
        }
    });

    app.listen(3000, () => {
        console.log('Server listening on http://localhost:3000');
    });
}

main().catch(console.error);
