import { Router } from 'express';
import passport from '../config/passport.config.js';
import { register, login, current, logout } from '../controllers/sessions.controller.js';

const router = Router();

const authenticateRegister = (req, res, next) => {
    passport.authenticate('register', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const message = info?.message === 'Missing credentials'
                ? 'Faltan campos obligatorios'
                : (info?.message || 'No se pudo registrar el usuario');
            return res.status(info?.status || 400).json({ status: 'error', message });
        }
        req.user = user;
        next();
    })(req, res, next);
};

const authenticateLogin = (req, res, next) => {
    passport.authenticate('login', { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
        }
        req.user = user;
        next();
    })(req, res, next);
};

const authenticateCurrent = (req, res, next) => {
    passport.authenticate('current', { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'No autenticado' });
        }
        req.user = user;
        next();
    })(req, res, next);
};

router.post('/register', authenticateRegister, register);
router.post('/login', authenticateLogin, login);
router.get('/current', authenticateCurrent, current);
router.post('/logout', logout);

export default router;