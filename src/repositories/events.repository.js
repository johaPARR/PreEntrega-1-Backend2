import eventsDao from '../dao/events.dao.js';

export class EventsRepository {
    constructor(dao) {
        this.dao = dao;
    }
    getAll() { return this.dao.getAll(); }
    getById(id) { return this.dao.getById(id); }
    create(eventData) { return this.dao.create(eventData); }
    update(id, eventData) { return this.dao.update(id, eventData); }
    delete(id) { return this.dao.delete(id); }
}

export default new EventsRepository(eventsDao);