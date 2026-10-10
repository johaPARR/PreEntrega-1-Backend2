import { generateToken } from '../utils/jwt.js';
import { toUserDTO } from '../dtos/user.dto.js';

const COOKIE_MAX_AGE = 3600000;

// req.user ya viene poblado por la estrategia 'register' de Passport
export const register = (req, res) => {
    res.status(201).json({
        status: 'success',
        payload: toUserDTO(req.user)
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
    res.status(200).json({ status: 'success', payload: toUserDTO(req.user) });
};

// Logout no pasa por Passport
export const logout = (req, res) => {
    res.clearCookie('currentUser');
    res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};