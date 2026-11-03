import {
    collectDefaultMetrics,
    register,
    Counter,
    Histogram
} from '@prometheus-io/client';

// Métricas internas de Node.js
collectDefaultMetrics();

// Contador de solicitudes HTTP
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// Histograma de duración de solicitudes HTTP
export const httpRequestDurationSeconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5]
});

export { register };