import express from 'express';
import cookieParser from 'cookie-parser';
import passport from './config/passport.config.js';
import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';
import usersRouter from './routes/users.router.js';
import ticketsRouter from "./routes/tickets.router.js";
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
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