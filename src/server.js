import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.config.js';

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
    });
};

startServer();