import ticketsService from "../services/tickets.service.js";

const handleError = (res, error) => {
  const status = error.status || 500;
  const message = status === 500 ? "Error interno del servidor" : error.message;
  if (status === 500) console.error(error);
  return res.status(status).json({ status: "error", message });
};

export const createTicket = async (req, res) => {
  try {
    const { eid } = req.params;
    const { quantity } = req.body;
    const ticket = await ticketsService.createTicket(eid, req.user, quantity);
    return res.status(201).json({ status: "success", payload: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await ticketsService.getMyTickets(req.user.id);
    return res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getEventTickets = async (req, res) => {
  try {
    const { eid } = req.params;
    const tickets = await ticketsService.getEventTickets(eid, req.user);
    return res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelTicket = async (req, res) => {
  try {
    const { tid } = req.params;
    const ticket = await ticketsService.cancelTicket(tid, req.user);
    return res.status(200).json({ status: "success", payload: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};