import express from 'express';
import cookieParser from 'cookie-parser';
import passport from './config/passport.config.js';
import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';
import usersRouter from './routes/users.router.js';
import ticketsRouter from "./routes/tickets.router.js";
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

import {
    httpRequestsTotal,
    httpRequestDurationSeconds,
    register
} from './config/metrics.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Middleware de métricas HTTP
app.use((req, res, next) => {
    if (req.path === '/metrics') {
        return next();
    }

    const endTimer = httpRequestDurationSeconds.startTimer();

    res.on('finish', () => {
        const route = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : 'unmatched';

        const labels = {
            method: req.method,
            route,
            status_code: String(res.statusCode)
        };

        httpRequestsTotal.inc(labels);
        endTimer(labels);
    });

    next();
});

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res, next) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        next(error);
    }
});

// Rutas originales
app.use("/api", ticketsRouter);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok", message: "Servidor activo" });
});

app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);

// Siempre al final: primero 404 para rutas inexistentes, después el manejador de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;