import usersRepository from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

export class SessionsService {
    constructor(repository) {
        this.repository = repository;
    }

    async register({ first_name, last_name, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await this.repository.getByEmail(normalizedEmail);
        if (existingUser) {
            const error = new Error('El email ya está registrado');
            error.status = 409;
            throw error;
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