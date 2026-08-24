import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.config.js';

dotenv.config();

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
    });
};

startServer();