import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error('La variable de entorno MONGO_URL no está definida');
        }
        await mongoose.connect(mongoUrl);
        console.log('🗄️  MongoDB conectado correctamente');
    } catch (error) {
        console.error('❌ Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};