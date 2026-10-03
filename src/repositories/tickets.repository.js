import ticketsDao from "../dao/tickets.dao.js";

class TicketsRepository {
  async createTicket(data) {
    return ticketsDao.create(data);
  }

  async getTicketById(id) {
    return ticketsDao.getById(id);
  }

  async getTicketsByUser(userId) {
    return ticketsDao.getByUser(userId);
  }

  async getTicketsByEvent(eventId) {
    return ticketsDao.getByEvent(eventId);
  }

  async findActiveTicket(userId, eventId) {
    return ticketsDao.getActiveByUserAndEvent(userId, eventId);
  }

  async getOccupiedSeats(eventId) {
    return ticketsDao.countActiveQuantityByEvent(eventId);
  }

  async cancelTicket(id) {
    return ticketsDao.updateById(id, {
      status: "cancelled",
      cancelledAt: new Date(),
    });
  }
}

export default new TicketsRepository();