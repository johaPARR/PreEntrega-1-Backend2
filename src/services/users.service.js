import usersRepository from '../repositories/users.repository.js';

export class UsersService {
    constructor(repository) {
        this.repository = repository;
    }

    // Devuelve todos los usuarios SIN el password
    async getUsers() {
        const users = await this.repository.getAll();
        return users.map(({ password, ...safeUser }) => safeUser);
    }
}

export default new UsersService(usersRepository);