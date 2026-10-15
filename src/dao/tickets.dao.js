import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";

class TicketsDao {
  async create(data) {
    return Ticket.create(data);
  }

  async getById(id) {
    return Ticket.findById(id);
  }

  async getByUser(userId) {
    return Ticket.find({ user: userId })
      .populate("event", "title date location")
      .sort({ createdAt: -1 });
  }

  async getByEvent(eventId) {
    return Ticket.find({ event: eventId })
      .populate("user", "first_name last_name email")
      .sort({ createdAt: -1 });
  }

  async getByUserAndEventWithStatuses(userId, eventId, statuses) {
    return Ticket.findOne({
      user: userId,
      event: eventId,
      status: { $in: statuses },
    });
  }

  async sumQuantityByEventAndStatuses(eventId, statuses) {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          status: { $in: statuses },
        },
      },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    return result.length ? result[0].total : 0;
  }

  async updateById(id, data) {
    return Ticket.findByIdAndUpdate(id, data, { new: true });
  }

  isValidId(id) {
    return mongoose.isValidObjectId(id);
  }
}

export default new TicketsDao();