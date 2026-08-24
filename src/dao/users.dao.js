import { UserModel } from '../models/User.js';

export class UsersDao {
    async getAll() {
        return UserModel.find().lean();
    }
    async getById(id) {
        return UserModel.findById(id).lean();
    }
    async getByEmail(email) {
        return UserModel.findOne({ email }).lean();
    }
    async create(userData) {
        return UserModel.create(userData);
    }
}

export default new UsersDao();