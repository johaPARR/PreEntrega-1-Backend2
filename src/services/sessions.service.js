import usersRepository from '../repositories/users.repository.js';

export class SessionsService {
    constructor(repository) {
        this.repository = repository;
    }
    async login(email, password) {
        const user = await this.repository.getByEmail(email);
        return { user, authenticated: Boolean(user) };
    }
}

export default new SessionsService(usersRepository);