import eventsRepository from '../repositories/events.repository.js';

// Helper para crear errores de negocio con código HTTP
const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

export class EventsService {
    constructor(repository) {
        this.repository = repository;
    }

    // Listado público con filtros, paginación y ordenamiento
    async getEvents(queryParams = {}) {
        const { status, category, location, dateFrom, dateTo, page, limit, sort } = queryParams;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (category) {
            filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
        }

        if (location) {
            filter.location = { $regex: location.trim(), $options: 'i' };
        }

        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) filter.date.$gte = new Date(dateFrom);
            if (dateTo) filter.date.$lte = new Date(dateTo);
        }

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

        // Ordenamiento por defecto por fecha ascendente
        let sortOption = { date: 1 };
        if (sort) {
            if (sort === 'date' || sort === 'asc') sortOption = { date: 1 };
            else if (sort === '-date' || sort === 'desc') sortOption = { date: -1 };
            else if (typeof sort === 'string') {
                const isDesc = sort.startsWith('-');
                const field = isDesc ? sort.substring(1) : sort;
                sortOption = { [field]: isDesc ? -1 : 1 };
            }
        }

        return this.repository.getPaginated({
            filter,
            page: parsedPage,
            limit: parsedLimit,
            sort: sortOption
        });
    }

    // Consulta de evento individual por ID
    async getEventById(id) {
        const event = await this.repository.getById(id);
        if (!event) {
            throw createError('Evento no encontrado', 404);
        }
        return event;
    }

    // Crear evento con validaciones de negocio
    async createEvent(eventData) {
        const { title, description, category, date, location, capacity, price, status, organizer } = eventData;

        // Validar obligatoriedad
        if (!title || !description || !category || !date || !location || capacity === undefined) {
            throw createError('Faltan campos obligatorios (title, description, category, date, location, capacity)', 400);
        }

        // Regla de negocio: No permitir fecha pasada
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            throw createError('La fecha proporcionada no es válida', 400);
        }
        if (eventDate <= new Date()) {
            throw createError('No se permite crear eventos con fecha pasada', 400);
        }

        // Regla de negocio: Capacidad > 0
        const numCapacity = Number(capacity);
        if (isNaN(numCapacity) || numCapacity <= 0) {
            throw createError('La capacidad debe ser un número mayor a 0', 400);
        }

        // Regla de negocio: Precio >= 0
        const numPrice = price !== undefined ? Number(price) : 0;
        if (isNaN(numPrice) || numPrice < 0) {
            throw createError('El precio no puede ser negativo', 400);
        }

        // Estado inicial
        let eventStatus = status || 'draft';
        if (!['draft', 'published'].includes(eventStatus)) {
            throw createError('El estado inicial de un evento debe ser draft o published', 400);
        }

        return this.repository.create({
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            date: eventDate,
            location: location.trim(),
            capacity: numCapacity,
            price: numPrice,
            status: eventStatus,
            organizer
        });
    }

    // Modificar evento validando propiedad y estado no cancelado
    async updateEvent(id, user, updateData = {}) {
        const event = await this.getEventById(id);

        // Control de permisos: solo dueño o admin
        const isAdmin = user.role === 'admin';
        const organizerId = String(event.organizer?._id || event.organizer);
        const isOwner = organizerId === String(user.id);

        if (!isAdmin && !isOwner) {
            throw createError('No podés modificar un evento que no es tuyo', 403);
        }

        // Regla de negocio: Eventos cancelados no pueden modificarse
        if (event.status === 'cancelled') {
            throw createError('No se puede modificar un evento cancelado', 400);
        }

        // Validaciones sobre los campos que se deseen cambiar
        const changes = {};

        if (updateData.title !== undefined) changes.title = updateData.title.trim();
        if (updateData.description !== undefined) changes.description = updateData.description.trim();
        if (updateData.category !== undefined) changes.category = updateData.category.trim();
        if (updateData.location !== undefined) changes.location = updateData.location.trim();

        if (updateData.date !== undefined) {
            const newDate = new Date(updateData.date);
            if (isNaN(newDate.getTime())) throw createError('Fecha inválida', 400);
            if (newDate <= new Date()) throw createError('No se permite asignar una fecha pasada', 400);
            changes.date = newDate;
        }

        if (updateData.capacity !== undefined) {
            const cap = Number(updateData.capacity);
            if (isNaN(cap) || cap <= 0) throw createError('La capacidad debe ser mayor a 0', 400);
            changes.capacity = cap;
        }

        if (updateData.price !== undefined) {
            const pr = Number(updateData.price);
            if (isNaN(pr) || pr < 0) throw createError('El precio no puede ser negativo', 400);
            changes.price = pr;
        }

        return this.repository.update(id, changes);
    }

    // Cambiar estado del evento (PATCH /api/events/:id/status)
    async changeStatus(id, user, newStatus) {
        const validStatuses = ['draft', 'published', 'cancelled', 'finished'];
        if (!newStatus || !validStatuses.includes(newStatus)) {
            throw createError(`Estado no válido. Valores permitidos: ${validStatuses.join(', ')}`, 400);
        }

        const event = await this.getEventById(id);

        // Control de permisos: solo dueño o admin
        const isAdmin = user.role === 'admin';
        const organizerId = String(event.organizer?._id || event.organizer);
        const isOwner = organizerId === String(user.id);

        if (!isAdmin && !isOwner) {
            throw createError('No podés modificar un evento que no es tuyo', 403);
        }

        // Regla de negocio: Cambiar estado de evento cancelado da error
        if (event.status === 'cancelled') {
            throw createError('No se puede cambiar el estado de un evento cancelado', 400);
        }

        // Regla de negocio: No permitir publicar eventos ya finalizados o cancelados
        if (newStatus === 'published' && (event.status === 'finished' || event.status === 'cancelled')) {
            throw createError('No se puede publicar un evento que ya fue finalizado o cancelado', 400);
        }

        return this.repository.update(id, { status: newStatus });
    }
}

export default new EventsService(eventsRepository);