import usersDao from '../dao/users.dao.js';

export class UsersRepository {
    constructor(dao) {
        this.dao = dao;
    }
    getAll() { return this.dao.getAll(); }
    getById(id) { return this.dao.getById(id); }
    getByEmail(email) { return this.dao.getByEmail(email); }
    create(userData) { return this.dao.create(userData); }
}

export default new UsersRepository(usersDao);