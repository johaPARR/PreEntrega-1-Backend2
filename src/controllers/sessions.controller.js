import sessionsService from '../services/sessions.service.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await sessionsService.login(email, password);
        res.status(200).json({ status: 'success', payload: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};