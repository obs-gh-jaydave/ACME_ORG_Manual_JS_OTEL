import { context, trace, propagation, SpanStatusCode } from '@opentelemetry/api';
import opentelemetry from '@opentelemetry/api';
import originRequest, { CoreOptions, UriOptions, UrlOptions, Response } from 'request';

const headersSetter = {
  set(carrier: Record<string, string>, key: string, value?: string) {
    carrier[key] = value || '';
  },
};

export function doOutgoingRequest(options: CoreOptions & (UriOptions | UrlOptions)): Promise<{response: Response; body: any}> {
    const tracer = opentelemetry.trace.getTracer('simple-api', '1.0.0');

    const parentCtx = context.active();
    const span = tracer.startSpan('outgoing-request', {
        attributes: {
            'http.url': String(('url' in options ? options.url : options.uri) || options.baseUrl || ''),
        }
    }, parentCtx);

    propagation.inject(parentCtx, options.headers || (options.headers = {}), headersSetter);

    return new Promise((resolve, reject) => {
        context.with(trace.setSpan(parentCtx, span), () => {
            originRequest(options, (error:Error | null, response: Response, body:any) => {
                if (error) {
                    span.recordException(error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    span.end();
                    return reject(error);
                }

                span.setAttribute('http.status_code', response.statusCode || 0);
                span.end();
                resolve({ response, body });
            });
        });
    });
}
