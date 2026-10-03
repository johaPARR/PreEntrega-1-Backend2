import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";

const ACTIVE_STATUSES = ["confirmed", "pending"];

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

  async getActiveByUserAndEvent(userId, eventId) {
    return Ticket.findOne({
      user: userId,
      event: eventId,
      status: { $in: ACTIVE_STATUSES },
    });
  }

  async countActiveQuantityByEvent(eventId) {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          status: { $in: ACTIVE_STATUSES },
        },
      },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    return result.length ? result[0].total : 0;
  }

  async updateById(id, data) {
    return Ticket.findByIdAndUpdate(id, data, { new: true });
  }
}

export default new TicketsDao();