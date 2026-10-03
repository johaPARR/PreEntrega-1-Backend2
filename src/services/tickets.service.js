import crypto from "crypto";
import mongoose from "mongoose";
import ticketsRepository from "../repositories/tickets.repository.js";
import eventsService from "./events.service.js";
import { sendTicketConfirmation } from "../utils/mailer.js";

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const generateReservationCode = () =>
  `TCK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const getExistingEvent = async (eventId) => {
  if (!mongoose.isValidObjectId(eventId)) {
    throw createError(404, "Evento no encontrado");
  }
  const event = await eventsService.getEventById(eventId);
  if (!event) {
    throw createError(404, "Evento no encontrado");
  }
  return event;
};

class TicketsService {
  async createTicket(eventId, user, quantity) {
    // 1. El evento existe
    const event = await getExistingEvent(eventId);

    // 2. El evento está publicado (no cancelado ni finalizado)
    if (event.status === "cancelled") {
      throw createError(400, "El evento está cancelado");
    }
    if (event.status === "finished" || new Date(event.date) < new Date()) {
      throw createError(400, "El evento ya finalizó");
    }
    if (event.status !== "published") {
      throw createError(400, "El evento no está publicado");
    }

    // 3. La cantidad es válida
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw createError(400, "La cantidad debe ser un número entero mayor a 0");
    }

    // 4. Hay cupos suficientes (los tickets cancelados no cuentan)
    const occupied = await ticketsRepository.getOccupiedSeats(eventId);
    const available = event.capacity - occupied;
    if (qty > available) {
      throw createError(
        409,
        `No hay cupos suficientes. Lugares disponibles: ${Math.max(available, 0)}`
      );
    }

    // 5. El usuario no tiene ya un ticket activo para este evento
    const existing = await ticketsRepository.findActiveTicket(user.id, eventId);
    if (existing) {
      throw createError(409, "Ya tenés una inscripción activa para este evento");
    }

    // Crear el ticket (solo referencias, no objetos completos)
    const ticket = await ticketsRepository.createTicket({
      user: user.id,
      event: eventId,
      quantity: qty,
      status: "confirmed",
      reservationCode: generateReservationCode(),
    });

    // Email de confirmación: si falla, la inscripción igual queda guardada
    try {
      await sendTicketConfirmation({ to: user.email, event, ticket });
    } catch (error) {
      console.error("No se pudo enviar el email de confirmación:", error.message);
    }

    return ticket;
  }

  async getMyTickets(userId) {
    return ticketsRepository.getTicketsByUser(userId);
  }

  async getEventTickets(eventId, user) {
    const event = await getExistingEvent(eventId);

    const organizerId = event.organizer?._id ?? event.organizer;
    if (user.role !== "admin" && String(organizerId) !== String(user.id)) {
      throw createError(403, "Solo podés ver los tickets de tus propios eventos");
    }

    return ticketsRepository.getTicketsByEvent(eventId);
  }

  async cancelTicket(ticketId, user) {
    if (!mongoose.isValidObjectId(ticketId)) {
      throw createError(404, "Ticket no encontrado");
    }

    const ticket = await ticketsRepository.getTicketById(ticketId);
    if (!ticket) {
      throw createError(404, "Ticket no encontrado");
    }

    if (user.role !== "admin" && String(ticket.user) !== String(user.id)) {
      throw createError(403, "No podés cancelar un ticket que no es tuyo");
    }

    if (ticket.status === "cancelled") {
      throw createError(400, "El ticket ya está cancelado");
    }

    return ticketsRepository.cancelTicket(ticketId);
  }
}

export default new TicketsService();