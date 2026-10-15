import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../src/models/User.js';
import { EventModel } from '../src/models/Event.js';

const SALT_ROUNDS = 10;

const seedDatabase = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            console.error('❌ Error: La variable MONGO_URL no está configurada en el archivo .env');
            process.exit(1);
        }

        console.log('⏳ Conectando a MongoDB Atlas...');
        await mongoose.connect(mongoUrl);
        console.log('✅ Conexión establecida.');

        const hashedPassword = await bcrypt.hash('123456', SALT_ROUNDS);

        // 1. Usuarios de prueba
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

        console.log('\n👤 Creando / actualizando usuarios de prueba...');
        const userMap = {};
        for (const user of testUsers) {
            const existing = await UserModel.findOneAndUpdate(
                { email: user.email },
                { $set: user },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            userMap[user.email] = existing;
            console.log(`   - [${existing.role.toUpperCase()}] ${existing.email} (Contraseña: 123456)`);
        }

        const organizerUser = userMap['organizer@test.com'];

        // 2. Eventos de prueba
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

        console.log('\n📅 Creando / actualizando eventos de prueba...');
        for (const evt of testEvents) {
            const existing = await EventModel.findOneAndUpdate(
                { title: evt.title },
                { $set: evt },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`   - [${existing.status.toUpperCase()}] "${existing.title}" | Capacidad: ${existing.capacity} | ID: ${existing._id}`);
        }

        console.log('\n🎉 ¡Base de datos poblada exitosamente!\n');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando seed:', error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

seedDatabase();
