import { Router } from 'express';
import { 
    getEvents, 
    getEventById, 
    createEvent, 
    updateEvent, 
    changeEventStatus 
} from '../controllers/events.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// --- Endpoints Públicos ---
// GET /api/events → Listado con filtros, paginación y ordenamiento
router.get('/', getEvents);

// GET /api/events/:id → Detalle público de un evento
router.get('/:id', getEventById);

// --- Endpoints Protegidos (solo organizer y admin) ---
// POST /api/events → Crear evento (403 para rol 'user')
router.post('/', authenticate, authorize('organizer', 'admin'), createEvent);

// PUT /api/events/:id → Modificar evento (solo dueño o admin)
router.put('/:id', authenticate, authorize('organizer', 'admin'), updateEvent);

// PATCH /api/events/:id/status → Cambiar estado (draft, published, cancelled, finished)
router.patch('/:id/status', authenticate, authorize('organizer', 'admin'), changeEventStatus);

export default router;