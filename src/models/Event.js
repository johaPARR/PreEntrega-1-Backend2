import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true }
});

export const EventModel = mongoose.model('events', eventSchema);