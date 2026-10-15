import usersRepository from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

export class SessionsService {
    constructor(repository) {
        this.repository = repository;
    }

    async register({ first_name, last_name, email, password }) {
        if (!first_name || !last_name || !email || !password) {
            throw createError(400, 'Faltan campos obligatorios');
        }
        if (!EMAIL_REGEX.test(email)) {
            throw createError(400, 'Formato de email inválido');
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            throw createError(400, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await this.repository.getByEmail(normalizedEmail);
        if (existingUser) {
            throw createError(409, 'El email ya está registrado');
        }

        const hashedPassword = await hashPassword(password);

        return this.repository.create({
            first_name,
            last_name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user'
        });
    }

    async validateCredentials(email, password) {
        const user = await this.repository.getByEmail(email);
        if (!user) return null;

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) return null;

        return user;
    }
}

export default new SessionsService(usersRepository);