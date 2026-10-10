import usersService from '../services/users.service.js';
import { toUserListItemDTO } from '../dtos/user.dto.js';

export const getUsers = async (req, res, next) => {
    try {
        const users = await usersService.getUsers();
        res.status(200).json({ status: 'success', payload: users.map(toUserListItemDTO) });
    } catch (error) {
        next(error);
    }
};