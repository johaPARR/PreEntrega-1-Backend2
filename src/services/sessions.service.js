import usersRepository from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';

export class SessionsService {
    constructor(repository) {
        this.repository = repository;
    }

    async login(email, password) {
        const user = await this.repository.getByEmail(email);

        if (!user) {
            const error = new Error('Credenciales inválidas');
            error.status = 401;
            throw error;
        }

        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            const error = new Error('Credenciales inválidas');
            error.status = 401;
            throw error;
        }

        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role
        });

        return token;
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