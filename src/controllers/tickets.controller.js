import ticketsService from "../services/tickets.service.js";
import { toTicketDTO } from "../dtos/ticket.dto.js";

export const createTicket = async (req, res, next) => {
  try {
    const { eid } = req.params;
    const { quantity } = req.body;
    const ticket = await ticketsService.createTicket(eid, req.user, quantity);
    return res.status(201).json({ status: "success", payload: toTicketDTO(ticket) });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getMyTickets(req.user.id);
    return res.status(200).json({ status: "success", payload: tickets.map(toTicketDTO) });
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req, res, next) => {
  try {
    const { eid } = req.params;
    const tickets = await ticketsService.getEventTickets(eid, req.user);
    return res.status(200).json({ status: "success", payload: tickets.map(toTicketDTO) });
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const { tid } = req.params;
    const ticket = await ticketsService.cancelTicket(tid, req.user);
    return res.status(200).json({ status: "success", payload: toTicketDTO(ticket) });
  } catch (error) {
    next(error);
  }
};