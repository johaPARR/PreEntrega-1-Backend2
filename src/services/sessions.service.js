import usersRepository from '../repositories/users.repository.js';
import { hashPassword } from '../utils/hash.js';

export class SessionsService {
    constructor(repository) {
        this.repository = repository;
    }

    async login(email, password) {
        const user = await this.repository.getByEmail(email);
        return { user, authenticated: Boolean(user) };
    }

    async register({ first_name, last_name, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await this.repository.getByEmail(normalizedEmail);
        if (existingUser) {
            const error = new Error('El email ya está registrado');
            error.status = 409;
            throw error;
        }

        const hashedPassword = hashPassword(password);

        const newUser = await this.repository.create({
            first_name,
            last_name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user'
        });

        return {
            id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            role: newUser.role
        };
    }
}

export default new SessionsService(usersRepository);