import { EventModel } from '../models/Event.js';

export class EventsDao {
    async getAll() {
        return EventModel.find().lean();
    }
    async getById(id) {
        return EventModel.findById(id).lean();
    }
    async create(eventData) {
        return EventModel.create(eventData);
    }
    async update(id, eventData) {
        return EventModel.findByIdAndUpdate(id, eventData, { new: true }).lean();
    }
    async delete(id) {
        return EventModel.findByIdAndDelete(id).lean();
    }
}

export default new EventsDao();