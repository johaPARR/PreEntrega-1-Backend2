import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = (plainPassword) => {
    return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
};

export const comparePassword = (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
};