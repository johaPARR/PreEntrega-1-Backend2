import mongoose from 'mongoose';
import { EventModel } from '../models/Event.js';

export class EventsDao {
    // Consulta paginada con filtros y ordenamiento
    async getPaginated({ filter = {}, page = 1, limit = 10, sort = { date: 1 } } = {}) {
        const skip = (page - 1) * limit;

        const [total, data] = await Promise.all([
            EventModel.countDocuments(filter),
            EventModel.find(filter)
                .populate('organizer', 'first_name last_name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
            data,
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages
        };
    }

    // Traer un evento por ID con datos del organizador
    async getById(id) {
        return EventModel.findById(id)
            .populate('organizer', 'first_name last_name email')
            .lean();
    }

    // Crear evento
    async create(eventData) {
        return EventModel.create(eventData);
    }

    // Actualizar evento con validadores del modelo activos
    async update(id, eventData) {
        return EventModel.findByIdAndUpdate(id, eventData, { new: true, runValidators: true })
            .populate('organizer', 'first_name last_name email')
            .lean();
    }

    // Eliminación física (no la usamos en la API porque hacemos baja lógica por status, pero queda en el DAO)
    async delete(id) {
        return EventModel.findByIdAndDelete(id).lean();
    }

    // Reservar cupo de forma atómica: la condición y el incremento ocurren
    // en una sola operación, así dos pedidos simultáneos no pueden sobrevender.
    // Devuelve el evento actualizado, o null si no hay cupo suficiente.
    async reserveSeats(id, quantity) {
        return EventModel.findOneAndUpdate(
            {
                _id: id,
                status: 'published',
                $expr: {
                    $lte: [
                        { $add: [{ $ifNull: ['$reservedSeats', 0] }, quantity] },
                        '$capacity'
                    ]
                }
            },
            { $inc: { reservedSeats: quantity } },
            { new: true }
        ).lean();
    }

    // Liberar cupo (al cancelar un ticket). Nunca deja el contador en negativo.
    async releaseSeats(id, quantity) {
        return EventModel.findOneAndUpdate(
            { _id: id, reservedSeats: { $gte: quantity } },
            { $inc: { reservedSeats: -quantity } },
            { new: true }
        ).lean();
    }

    // Verifica que el id tenga formato de ObjectId válido
    isValidId(id) {
        return mongoose.isValidObjectId(id);
    }
}

export default new EventsDao();