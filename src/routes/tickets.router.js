import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import {
  createTicket,
  getMyTickets,
  getEventTickets,
  cancelTicket,
} from "../controllers/tickets.controller.js";

const router = Router();

router.post("/events/:eid/tickets", authenticate, createTicket);

router.get(
  "/events/:eid/tickets",
  authenticate,
  authorize("organizer", "admin"),
  getEventTickets
);

router.get("/tickets/my-tickets", authenticate, getMyTickets);

router.patch("/tickets/:tid/cancel", authenticate, cancelTicket);

export default router;