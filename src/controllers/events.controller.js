import mongoose from 'mongoose';
import eventsService from '../services/events.service.js';

// GET /api/events → devuelve solo los eventos publicados (no cancelados)
export const getEvents = async (req, res) => {
    try {
        const events = await eventsService.getEvents();
        const published = events.filter((event) => event.status !== 'cancelled');
        res.status(200).json({ status: 'success', payload: published });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// POST /api/events → solo organizer y admin (lo controla el middleware)
// El organizer sale del usuario logueado (req.user), NUNCA del body.
export const createEvent = async (req, res) => {
    try {
        const { title, date } = req.body;

        if (!title || !date) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios (title, date)' });
        }

        const event = await eventsService.createEvent({
            title,
            date,
            organizer: req.user.id
        });

        res.status(201).json({
            status: 'success',
            payload: {
                id: event._id,
                title: event.title,
                date: event.date,
                status: event.status,
                organizer: event.organizer
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// PUT /api/events/:id → organizer solo sus eventos, admin cualquiera
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 'error', message: 'ID de evento inválido' });
        }

        const event = await eventsService.getEventById(id);
        if (!event) {
            return res.status(404).json({ status: 'error', message: 'Evento no encontrado' });
        }

        // Validación de propiedad: si no es admin, tiene que ser el dueño
        const isAdmin = req.user.role === 'admin';
        const isOwner = String(event.organizer) === String(req.user.id);
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                status: 'error',
                message: 'No podés modificar un evento que no es tuyo'
            });
        }

        // Solo se pueden cambiar estos campos (el organizer no se toca)
        const { title, date, status } = req.body;
        const changes = {};
        if (title !== undefined) changes.title = title;
        if (date !== undefined) changes.date = date;
        if (status !== undefined) changes.status = status;

        await eventsService.updateEvent(id, changes);
        const updated = await eventsService.getEventById(id);

        res.status(200).json({ status: 'success', payload: updated });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};