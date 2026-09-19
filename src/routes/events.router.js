import { Router } from 'express';
import { getEvents, createEvent, updateEvent } from '../controllers/events.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// Cualquier usuario autenticado puede consultar eventos publicados
router.get('/', authenticate, getEvents);

// Solo organizer y admin pueden crear eventos (403 para user)
router.post('/', authenticate, authorize('organizer', 'admin'), createEvent);

// Solo organizer y admin; además el controller valida que el organizer sea el dueño
router.put('/:id', authenticate, authorize('organizer', 'admin'), updateEvent);

export default router;