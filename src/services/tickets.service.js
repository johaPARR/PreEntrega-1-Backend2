import crypto from "crypto";
import ticketsRepository from "../repositories/tickets.repository.js";
import eventsRepository from "../repositories/events.repository.js";
import eventsService from "./events.service.js";
import {
  sendTicketConfirmation,
  sendTicketCancellation,
} from "../utils/mailer.js";

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const generateReservationCode = () =>
  `TCK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const getExistingEvent = async (eventId) => {
  if (!ticketsRepository.isValidId(eventId)) {
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

    // 4. El usuario no tiene ya un ticket activo para este evento
    const existing = await ticketsRepository.findActiveTicket(user.id, eventId);
    if (existing) {
      throw createError(409, "Ya tenés una inscripción activa para este evento");
    }

    // 5. Reservar cupo de forma atómica (evita sobreventa con pedidos simultáneos)
    const reserved = await eventsRepository.reserveSeats(eventId, qty);
    if (!reserved) {
      const fresh = await eventsRepository.getById(eventId);
      const available = Math.max(
        (fresh?.capacity ?? 0) - (fresh?.reservedSeats ?? 0),
        0
      );
      throw createError(
        409,
        `No hay cupos suficientes. Lugares disponibles: ${available}`
      );
    }

    // 6. Crear el ticket (solo referencias). Si falla, se devuelve el cupo reservado
    let ticket;
    try {
      ticket = await ticketsRepository.createTicket({
        user: user.id,
        event: eventId,
        quantity: qty,
        status: "confirmed",
        reservationCode: generateReservationCode(),
      });
    } catch (error) {
      await eventsRepository.releaseSeats(eventId, qty);
      throw error;
    }

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
    if (!ticketsRepository.isValidId(ticketId)) {
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

    const cancelled = await ticketsRepository.cancelTicket(ticketId);

    // Liberar el cupo reservado
    const eventId = ticket.event?._id ?? ticket.event;
    await eventsRepository.releaseSeats(eventId, ticket.quantity);

    // Email de cancelación: si falla, la cancelación igual queda guardada
    try {
      if (String(ticket.user) === String(user.id)) {
        const event = await getExistingEvent(eventId);
        await sendTicketCancellation({ to: user.email, event, ticket });
      }
    } catch (error) {
      console.error("No se pudo enviar el email de cancelación:", error.message);
    }

    return cancelled;
  }
}

export default new TicketsService();