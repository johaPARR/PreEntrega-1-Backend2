import eventsRepository from '../repositories/events.repository.js';

export class EventsService {
    constructor(repository) {
        this.repository = repository;
    }
    async getEvents() { return this.repository.getAll(); }
    async getEventById(id) { return this.repository.getById(id); }
    async createEvent(eventData) { return this.repository.create(eventData); }
    async updateEvent(id, eventData) { return this.repository.update(id, eventData); }
    async deleteEvent(id) { return this.repository.delete(id); }
}

export default new EventsService(eventsRepository);