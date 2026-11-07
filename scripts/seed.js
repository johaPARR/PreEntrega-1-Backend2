
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../src/models/User.js';
import { EventModel } from '../src/models/Event.js';

const SALT_ROUNDS = 10;

const seedDatabase = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        const seedPassword = process.env.SEED_PASSWORD;
        const nodeEnv = process.env.NODE_ENV;

        if (nodeEnv === 'production') {
            throw new Error('El seed está deshabilitado en producción.');
        }

        if (!mongoUrl) {
            throw new Error('La variable MONGO_URL no está configurada.');
        }

        if (!seedPassword) {
            throw new Error('La variable SEED_PASSWORD no está configurada.');
        }

        if (seedPassword.length < 12) {
            throw new Error('SEED_PASSWORD debe tener al menos 12 caracteres.');
        }

        await mongoose.connect(mongoUrl);
        console.log('Conexión a MongoDB establecida.');

        const hashedPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS);

        const testUsers = [
            {
                first_name: 'Admin',
                last_name: 'Principal',
                email: 'admin@test.com',
                password: hashedPassword,
                role: 'admin'
            },
            {
                first_name: 'Organizador',
                last_name: 'Demo',
                email: 'organizer@test.com',
                password: hashedPassword,
                role: 'organizer'
            },
            {
                first_name: 'Usuario',
                last_name: 'Prueba',
                email: 'user@test.com',
                password: hashedPassword,
                role: 'user'
            }
        ];

        const userMap = {};

        for (const user of testUsers) {
            const existing = await UserModel.findOneAndUpdate(
                { email: user.email },
                { $set: user },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            userMap[user.email] = existing;
            console.log(`Usuario de prueba preparado: ${existing.email}`);
        }

        const organizerUser = userMap['organizer@test.com'];

        const testEvents = [
            {
                title: 'Congreso Tech 2027',
                description: 'Charlas y talleres sobre desarrollo backend con Node.js y arquitecturas limpias',
                category: 'congress',
                date: new Date('2027-05-20T10:00:00.000Z'),
                location: 'Córdoba, Argentina',
                capacity: 50,
                reservedSeats: 0,
                price: 1500,
                status: 'published',
                organizer: organizerUser._id
            },
            {
                title: 'Workshop de Microservicios',
                description: 'Taller práctico de diseño de microservicios y mensajería',
                category: 'workshop',
                date: new Date('2027-06-15T14:00:00.000Z'),
                location: 'Virtual / En línea',
                capacity: 30,
                reservedSeats: 0,
                price: 0,
                status: 'draft',
                organizer: organizerUser._id
            }
        ];

        for (const evt of testEvents) {
            const existing = await EventModel.findOneAndUpdate(
                { title: evt.title },
                { $set: evt },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`Evento de prueba preparado: ${existing.title}`);
        }

        console.log('Base de datos poblada exitosamente.');
    } catch (error) {
        console.error('Error ejecutando seed:', error.message);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

seedDatabase();

