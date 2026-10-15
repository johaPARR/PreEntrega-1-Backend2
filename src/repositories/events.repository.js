import eventsDao from '../dao/events.dao.js';

export class EventsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    getPaginated(params) {
        return this.dao.getPaginated(params);
    }

    getById(id) {
        return this.dao.getById(id);
    }

    create(eventData) {
        return this.dao.create(eventData);
    }

    update(id, eventData) {
        return this.dao.update(id, eventData);
    }

    delete(id) {
        return this.dao.delete(id);
    }

    // Reserva cupo de forma atómica. Devuelve el evento actualizado o null si no hay cupo.
    reserveSeats(id, quantity) {
        return this.dao.reserveSeats(id, quantity);
    }

    // Libera cupo al cancelar una inscripción.
    releaseSeats(id, quantity) {
        return this.dao.releaseSeats(id, quantity);
    }

    isValidId(id) {
        return this.dao.isValidId(id);
    }
}

export default new EventsRepository(eventsDao);