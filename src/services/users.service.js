import usersRepository from '../repositories/users.repository.js';

export class UsersService {
    constructor(repository) {
        this.repository = repository;
    }

    // Devuelve todos los usuarios SIN el password
    async getUsers() {
        const users = await this.repository.getAll();
        return users.map((user) => {
            // Si es un documento de Mongoose se pasa a objeto plano antes de quitar el password
            const plain = typeof user.toObject === 'function' ? user.toObject() : user;
            const { password, ...safeUser } = plain;
            return safeUser;
        });
    }
}

export default new UsersService(usersRepository);