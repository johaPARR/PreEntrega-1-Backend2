import eventsService from '../services/events.service.js';
import { toEventDTO } from '../dtos/event.dto.js';

// GET /api/events → Listado público con filtros y paginación
export const getEvents = async (req, res, next) => {
    try {
        const result = await eventsService.getEvents(req.query);
        res.status(200).json({
            status: 'success',
            ...result,
            data: (result.data ?? []).map(toEventDTO)
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/events/:id → Consulta pública de un evento por ID
export const getEventById = async (req, res, next) => {
    try {
        const event = await eventsService.getEventById(req.params.id);
        res.status(200).json({ status: 'success', payload: toEventDTO(event) });
    } catch (error) {
        next(error);
    }
};

// POST /api/events → Crear evento (organizer y admin)
// El organizer sale SIEMPRE del token autenticado (req.user), NUNCA del body.
export const createEvent = async (req, res, next) => {
    try {
        const event = await eventsService.createEvent({
            ...req.body,
            organizer: req.user.id
        });

        res.status(201).json({ status: 'success', payload: toEventDTO(event) });
    } catch (error) {
        next(error);
    }
};

// PUT /api/events/:id → Modificar evento (dueño o admin)
export const updateEvent = async (req, res, next) => {
    try {
        const updated = await eventsService.updateEvent(req.params.id, req.user, req.body);
        res.status(200).json({ status: 'success', payload: toEventDTO(updated) });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/events/:id/status → Cambiar estado de evento (dueño o admin)
export const changeEventStatus = async (req, res, next) => {
    try {
        const { status: newStatus } = req.body;
        const updated = await eventsService.changeStatus(req.params.id, req.user, newStatus);
        res.status(200).json({ status: 'success', payload: toEventDTO(updated) });
    } catch (error) {
        next(error);
    }
};