import ticketsDao from "../dao/tickets.dao.js";

const ACTIVE_STATUSES = ["confirmed", "pending"];

export class TicketsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async createTicket(data) {
    return this.dao.create(data);
  }

  async getTicketById(id) {
    return this.dao.getById(id);
  }

  async getTicketsByUser(userId) {
    return this.dao.getByUser(userId);
  }

  async getTicketsByEvent(eventId) {
    return this.dao.getByEvent(eventId);
  }

  async findActiveTicket(userId, eventId) {
    return this.dao.getByUserAndEventWithStatuses(
      userId,
      eventId,
      ACTIVE_STATUSES
    );
  }

  async getOccupiedSeats(eventId) {
    return this.dao.sumQuantityByEventAndStatuses(eventId, ACTIVE_STATUSES);
  }

  async cancelTicket(id) {
    return this.dao.updateById(id, {
      status: "cancelled",
      cancelledAt: new Date(),
    });
  }

  isValidId(id) {
    return this.dao.isValidId(id);
  }
}

export default new TicketsRepository(ticketsDao);