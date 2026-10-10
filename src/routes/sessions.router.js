import { Router } from 'express';
import passport from '../config/passport.config.js';
import { register, login, current, logout } from '../controllers/sessions.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Crea un error con código HTTP para que lo resuelva el middleware centralizado
const createError = (status, message) => Object.assign(new Error(message), { status });

const authenticateRegister = (req, res, next) => {
    passport.authenticate('register', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const message = info?.message === 'Missing credentials'
                ? 'Faltan campos obligatorios'
                : (info?.message || 'No se pudo registrar el usuario');
            return next(createError(info?.status || 400, message));
        }
        req.user = user;
        next();
    })(req, res, next);
};

const authenticateLogin = (req, res, next) => {
    passport.authenticate('login', { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) {
            return next(createError(401, 'Credenciales inválidas'));
        }
        req.user = user;
        next();
    })(req, res, next);
};

router.post('/register', authenticateRegister, register);
router.post('/login', authenticateLogin, login);
router.get('/current', authenticate, current);
router.post('/logout', logout);

export default router;