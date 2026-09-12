import { generateToken } from '../utils/jwt.js';

const COOKIE_MAX_AGE = 3600000;

// req.user ya viene poblado por la estrategia 'register' de Passport
export const register = (req, res) => {
    const { _id, first_name, last_name, email, role } = req.user;
    res.status(201).json({
        status: 'success',
        payload: { id: _id, first_name, last_name, email, role }
    });
};

// req.user ya viene poblado (y ya validado) por la estrategia 'login'.
// El controller es responsable de generar el JWT y setear la cookie.
export const login = (req, res) => {
    const { _id, email, role } = req.user;

    const token = generateToken({ id: _id, email, role });

    res.cookie('currentUser', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({ status: 'success', message: 'Login correcto' });
};

// req.user es el payload del JWT decodificado por la estrategia 'current'
export const current = (req, res) => {
    const { id, email, role } = req.user;
    res.status(200).json({ status: 'success', payload: { id, email, role } });
};

// Logout no pasa por Passport
export const logout = (req, res) => {
    res.clearCookie('currentUser');
    res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};