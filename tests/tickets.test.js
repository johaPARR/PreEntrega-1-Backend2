import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.JWT_SECRET = TEST_JWT_SECRET;

// El mailer se mockea ANTES de importar la app: los tests nunca envían emails reales
jest.unstable_mockModule('../src/utils/mailer.js', () => ({
    sendTicketConfirmation: jest.fn().mockResolvedValue(undefined)
}));

const { default: app } = await import('../src/app.js');
const { default: eventsService } = await import('../src/services/events.service.js');
const { default: ticketsRepository } = await import('../src/repositories/tickets.repository.js');
const { sendTicketConfirmation } = await import('../src/utils/mailer.js');

const createToken = (payload) => jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });

const userPayload = { id: '665f2a111111111111111111', email: 'user@test.com', role: 'user' };
const otherUserPayload = { id: '665f2a444444444444444444', email: 'userb@test.com', role: 'user' };
const organizerPayload = { id: '665f2a222222222222222222', email: 'org@test.com', role: 'organizer' };
const otherOrganizerPayload = { id: '665f2a555555555555555555', email: 'org2@test.com', role: 'organizer' };
const adminPayload = { id: '665f2a333333333333333333', email: 'admin@test.com', role: 'admin' };

const userToken = createToken(userPayload);
const otherUserToken = createToken(otherUserPayload);
const organizerToken = createToken(organizerPayload);
const otherOrganizerToken = createToken(otherOrganizerPayload);
const adminToken = createToken(adminPayload);

const eventId = '66901234567890abcdef1234';
const ticketId = '66902222222222222222aaaa';
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const buildEvent = (overrides = {}) => ({
    _id: eventId,
    title: 'Taller de Node.js',
    date: futureDate,
    location: 'Córdoba',
    capacity: 5,
    price: 0,
    status: 'published',
    organizer: organizerPayload.id,
    ...overrides
});

const buildTicket = (overrides = {}) => ({
    _id: ticketId,
    user: userPayload.id,
    event: eventId,
    quantity: 2,
    status: 'confirmed',
    reservationCode: 'TCK-A1B2C3D4',
    ...overrides
});

// Prepara los mocks de la inscripción y devuelve el spy de createTicket
const mockEnrollment = ({ event = buildEvent(), occupied = 0, active = null } = {}) => {
    jest.spyOn(eventsService, 'getEventById').mockResolvedValue(event);
    jest.spyOn(ticketsRepository, 'getOccupiedSeats').mockResolvedValue(occupied);
    jest.spyOn(ticketsRepository, 'findActiveTicket').mockResolvedValue(active);
    return jest.spyOn(ticketsRepository, 'createTicket').mockResolvedValue(buildTicket());
};

describe('Tests Automatizados — Pre-entrega 7: Tickets, inscripciones y control de cupos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('1. Inscripción (POST /api/events/:eid/tickets)', () => {
        test('Inscripción exitosa responde 201 y envía el email de confirmación', async () => {
            const createSpy = mockEnrollment();

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 2 });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.payload.status).toBe('confirmed');
            expect(res.body.payload.reservationCode).toBe('TCK-A1B2C3D4');
            // El ticket guarda solo referencias (ids), no objetos completos
            expect(createSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: userPayload.id,
                    event: eventId,
                    quantity: 2,
                    status: 'confirmed'
                })
            );
            expect(sendTicketConfirmation).toHaveBeenCalledTimes(1);
            expect(sendTicketConfirmation).toHaveBeenCalledWith(
                expect.objectContaining({ to: userPayload.email })
            );
        });

        test('Si falla el envío del email, la inscripción igual responde 201', async () => {
            mockEnrollment();
            jest.spyOn(console, 'error').mockImplementation(() => {});
            sendTicketConfirmation.mockRejectedValueOnce(new Error('SMTP caído'));

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 2 });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
        });

        test('Inscripción sin sesión responde 401', async () => {
            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .send({ quantity: 2 });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No autenticado');
        });

        test('Inscripción a evento inexistente responde 404', async () => {
            mockEnrollment({ event: null });

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 2 });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Evento no encontrado');
        });

        test('Inscripción a evento cancelado responde 400', async () => {
            mockEnrollment({ event: buildEvent({ status: 'cancelled' }) });

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 2 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('El evento está cancelado');
        });

        test('Inscripción a evento finalizado responde 400', async () => {
            mockEnrollment({ event: buildEvent({ status: 'finished' }) });

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 2 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('El evento ya finalizó');
        });

        test('Inscripción con quantity 0 responde 400', async () => {
            const createSpy = mockEnrollment();

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 0 });

            expect(res.status).toBe(400);
            expect(createSpy).not.toHaveBeenCalled();
        });

        test('Inscripción sin cupo suficiente responde 409 con mensaje claro y no crea el ticket', async () => {
            // capacity 5, ya hay 3 ocupados -> quedan 2, pide 4
            const createSpy = mockEnrollment({ occupied: 3 });

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 4 });

            expect(res.status).toBe(409);
            expect(res.body.message).toContain('Lugares disponibles: 2');
            expect(createSpy).not.toHaveBeenCalled();
            expect(sendTicketConfirmation).not.toHaveBeenCalled();
        });

        test('Inscripción duplicada con ticket activo responde 409', async () => {
            const createSpy = mockEnrollment({ active: buildTicket() });

            const res = await request(app)
                .post(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ quantity: 2 });

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Ya tenés una inscripción activa para este evento');
            expect(createSpy).not.toHaveBeenCalled();
        });
    });

    describe('2. Mis tickets (GET /api/tickets/my-tickets)', () => {
        test('Responde 200 con los tickets del usuario y los datos del evento', async () => {
            const myTickets = [
                {
                    ...buildTicket(),
                    event: { _id: eventId, title: 'Taller de Node.js', date: futureDate, location: 'Córdoba' }
                }
            ];
            const spy = jest.spyOn(ticketsRepository, 'getTicketsByUser').mockResolvedValue(myTickets);

            const res = await request(app)
                .get('/api/tickets/my-tickets')
                .set('Cookie', [`currentUser=${userToken}`]);

            expect(res.status).toBe(200);
            expect(spy).toHaveBeenCalledWith(userPayload.id);
            expect(res.body.payload[0].event.title).toBe('Taller de Node.js');
            expect(res.body.payload[0].event.location).toBe('Córdoba');
        });

        test('Sin sesión responde 401', async () => {
            const res = await request(app).get('/api/tickets/my-tickets');

            expect(res.status).toBe(401);
        });
    });

    describe('3. Tickets de un evento (GET /api/events/:eid/tickets)', () => {
        test('Usuario con rol "user" recibe 403', async () => {
            const res = await request(app)
                .get(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${userToken}`]);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('No tenés permisos para realizar esta acción');
        });

        test('Organizer de otro evento recibe 403', async () => {
            jest.spyOn(eventsService, 'getEventById').mockResolvedValue(buildEvent());

            const res = await request(app)
                .get(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${otherOrganizerToken}`]);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Solo podés ver los tickets de tus propios eventos');
        });

        test('Organizer dueño del evento recibe 200', async () => {
            jest.spyOn(eventsService, 'getEventById').mockResolvedValue(buildEvent());
            jest.spyOn(ticketsRepository, 'getTicketsByEvent').mockResolvedValue([buildTicket()]);

            const res = await request(app)
                .get(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${organizerToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.payload).toHaveLength(1);
        });

        test('Admin recibe 200 aunque no sea el dueño', async () => {
            jest.spyOn(eventsService, 'getEventById').mockResolvedValue(buildEvent());
            jest.spyOn(ticketsRepository, 'getTicketsByEvent').mockResolvedValue([buildTicket()]);

            const res = await request(app)
                .get(`/api/events/${eventId}/tickets`)
                .set('Cookie', [`currentUser=${adminToken}`]);

            expect(res.status).toBe(200);
        });
    });

    describe('4. Cancelación (PATCH /api/tickets/:tid/cancel)', () => {
        test('El dueño cancela su ticket: 200, status cancelled y cancelledAt registrado', async () => {
            jest.spyOn(ticketsRepository, 'getTicketById').mockResolvedValue(buildTicket());
            const cancelSpy = jest.spyOn(ticketsRepository, 'cancelTicket').mockResolvedValue({
                ...buildTicket(),
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            });

            const res = await request(app)
                .patch(`/api/tickets/${ticketId}/cancel`)
                .set('Cookie', [`currentUser=${userToken}`]);

            expect(res.status).toBe(200);
            expect(cancelSpy).toHaveBeenCalledWith(ticketId);
            expect(res.body.payload.status).toBe('cancelled');
            expect(res.body.payload.cancelledAt).toBeDefined();
        });

        test('Un user intentando cancelar un ticket ajeno recibe 403', async () => {
            jest.spyOn(ticketsRepository, 'getTicketById').mockResolvedValue(buildTicket());
            const cancelSpy = jest.spyOn(ticketsRepository, 'cancelTicket');

            const res = await request(app)
                .patch(`/api/tickets/${ticketId}/cancel`)
                .set('Cookie', [`currentUser=${otherUserToken}`]);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('No podés cancelar un ticket que no es tuyo');
            expect(cancelSpy).not.toHaveBeenCalled();
        });

        test('Un admin puede cancelar el ticket de otro usuario', async () => {
            jest.spyOn(ticketsRepository, 'getTicketById').mockResolvedValue(buildTicket());
            jest.spyOn(ticketsRepository, 'cancelTicket').mockResolvedValue({
                ...buildTicket(),
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            });

            const res = await request(app)
                .patch(`/api/tickets/${ticketId}/cancel`)
                .set('Cookie', [`currentUser=${adminToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.payload.status).toBe('cancelled');
        });

        test('Cancelar un ticket ya cancelado responde 400', async () => {
            jest.spyOn(ticketsRepository, 'getTicketById').mockResolvedValue(
                buildTicket({ status: 'cancelled' })
            );

            const res = await request(app)
                .patch(`/api/tickets/${ticketId}/cancel`)
                .set('Cookie', [`currentUser=${userToken}`]);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('El ticket ya está cancelado');
        });

        test('Cancelar un ticket inexistente responde 404', async () => {
            jest.spyOn(ticketsRepository, 'getTicketById').mockResolvedValue(null);

            const res = await request(app)
                .patch(`/api/tickets/${ticketId}/cancel`)
                .set('Cookie', [`currentUser=${userToken}`]);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Ticket no encontrado');
        });
    });
});