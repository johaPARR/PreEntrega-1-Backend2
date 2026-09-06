import sessionsService from '../services/sessions.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const COOKIE_MAX_AGE = 3600000;

export const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ status: 'error', message: 'Formato de email inválido' });
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ status: 'error', message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
        }

        const newUser = await sessionsService.register({ first_name, last_name, email, password });

        res.status(201).json({ status: 'success', payload: newUser });
    } catch (error) {
        if (error.status === 409) {
            return res.status(409).json({ status: 'error', message: error.message });
        }
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
        }

        const token = await sessionsService.login(email, password);

        res.cookie('currentUser', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({ status: 'success', message: 'Login correcto' });
    } catch (error) {
        if (error.status === 401) {
            return res.status(401).json({ status: 'error', message: error.message });
        }
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

export const current = (req, res) => {
    const { id, email, role } = req.user;
    res.status(200).json({ status: 'success', payload: { id, email, role } });
};

export const logout = (req, res) => {
    res.clearCookie('currentUser');
    res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};