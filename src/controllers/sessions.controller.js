import sessionsService from '../services/sessions.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

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
        const result = await sessionsService.login(email, password);
        res.status(200).json({ status: 'success', payload: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};