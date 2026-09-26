import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import eventsService from '../src/services/events.service.js';

// Usamos el secreto de entorno o el de prueba
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.JWT_SECRET = TEST_JWT_SECRET;

const createToken = (payload) => {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
};

describe('Pre-entrega 6: Entidad events y lógica de negocio', () => {
    const userPayload = { id: '665f2a111111111111111111', email: 'user@test.com', role: 'user' };
    const organizer1Payload = { id: '665f2a222222222222222222', email: 'org1@test.com', role: 'organizer' };
    const organizer2Payload = { id: '665f2a333333333333333333', email: 'org2@test.com', role: 'organizer' };
    const adminPayload = { id: '665f2a444444444444444444', email: 'admin@test.com', role: 'admin' };

    const userToken = createToken(userPayload);
    const org1Token = createToken(organizer1Payload);
    const org2Token = createToken(organizer2Payload);
    const adminToken = createToken(adminPayload);

    const validEventData = {
        title: 'Workshop de Node.js',
        description: 'Aprende arquitectura profesional en Node.js',
        category: 'workshop',
        date: '2027-05-20T10:00:00.000Z',
        location: 'Auditorio Central',
        capacity: 50,
        price: 1500
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('1. Creación de eventos (POST /api/events)', () => {
        test('Crear evento con rol "user" responde 403', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Cookie', [`currentUser=${userToken}`])
                .send(validEventData);

            expect(res.status).toBe(403);
            expect(res.body.status).toBe('error');
        });

        test('Crear evento con fecha pasada responde 400 (error de validación)', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Cookie', [`currentUser=${org1Token}`])
                .send({
                    ...validEventData,
                    date: '2020-01-01'
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('fecha pasada');
        });

        test('Crear evento con capacity: 0 responde 400 (error de validación)', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Cookie', [`currentUser=${org1Token}`])
                .send({
                    ...validEventData,
                    capacity: 0
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('capacidad');
        });

        test('Crear evento con rol "organizer" responde 201 (éxito)', async () => {
            const mockCreated = {
                _id: '669011112222333344445555',
                ...validEventData,
                status: 'draft',
                organizer: organizer1Payload.id
            };

            jest.spyOn(eventsService, 'createEvent').mockResolvedValue(mockCreated);

            const res = await request(app)
                .post('/api/events')
                .set('Cookie', [`currentUser=${org1Token}`])
                .send(validEventData);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.payload.title).toBe(validEventData.title);
        });
    });

    describe('2. Listado público con filtros y paginación (GET /api/events)', () => {
        test('Listar con filtros: ?status=published&category=workshop&page=2&limit=5', async () => {
            const mockPaginated = {
                data: [
                    { _id: '669011112222333344445555', title: 'Workshop 1', category: 'workshop', status: 'published' }
                ],
                page: 2,
                limit: 5,
                total: 10,
                totalPages: 2
            };

            jest.spyOn(eventsService, 'getEvents').mockResolvedValue(mockPaginated);

            const res = await request(app)
                .get('/api/events?status=published&category=workshop&page=2&limit=5');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.page).toBe(2);
            expect(res.body.limit).toBe(5);
            expect(res.body.total).toBe(10);
            expect(res.body.totalPages).toBe(2);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('3. Consulta individual de evento (GET /api/events/:id)', () => {
        test('Consultar evento inexistente responde 404', async () => {
            const fakeId = '669099999999999999999999';
            const err = new Error('Evento no encontrado');
            err.status = 404;

            jest.spyOn(eventsService, 'getEventById').mockRejectedValue(err);

            const res = await request(app)
                .get(`/api/events/${fakeId}`);

            expect(res.status).toBe(404);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Evento no encontrado');
        });
    });

    describe('4. Modificación de eventos (PUT /api/events/:id)', () => {
        test('organizer modifica evento propio responde 200 (éxito)', async () => {
            const eventId = '669011112222333344445555';
            const mockUpdated = {
                _id: eventId,
                ...validEventData,
                title: 'Título Modificado'
            };

            jest.spyOn(eventsService, 'updateEvent').mockResolvedValue(mockUpdated);

            const res = await request(app)
                .put(`/api/events/${eventId}`)
                .set('Cookie', [`currentUser=${org1Token}`])
                .send({ title: 'Título Modificado' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.payload.title).toBe('Título Modificado');
        });

        test('organizer modifica evento ajeno responde 403', async () => {
            const eventId = '669011112222333344445555';
            const err = new Error('No podés modificar un evento que no es tuyo');
            err.status = 403;

            jest.spyOn(eventsService, 'updateEvent').mockRejectedValue(err);

            const res = await request(app)
                .put(`/api/events/${eventId}`)
                .set('Cookie', [`currentUser=${org2Token}`])
                .send({ title: 'Intento de modificar' });

            expect(res.status).toBe(403);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No podés modificar un evento que no es tuyo');
        });

        test('admin modifica evento de otro organizador responde 200 (éxito)', async () => {
            const eventId = '669011112222333344445555';
            const mockUpdated = {
                _id: eventId,
                ...validEventData,
                title: 'Modificado por Admin'
            };

            jest.spyOn(eventsService, 'updateEvent').mockResolvedValue(mockUpdated);

            const res = await request(app)
                .put(`/api/events/${eventId}`)
                .set('Cookie', [`currentUser=${adminToken}`])
                .send({ title: 'Modificado por Admin' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.payload.title).toBe('Modificado por Admin');
        });
    });

    describe('5. Cambios de estado y eventos cancelados (PATCH /api/events/:id/status)', () => {
        test('Cambiar estado de evento cancelado responde 400 (error)', async () => {
            const eventId = '669011112222333344445555';
            const err = new Error('No se puede cambiar el estado de un evento cancelado');
            err.status = 400;

            jest.spyOn(eventsService, 'changeStatus').mockRejectedValue(err);

            const res = await request(app)
                .patch(`/api/events/${eventId}/status`)
                .set('Cookie', [`currentUser=${org1Token}`])
                .send({ status: 'published' });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('cancelado');
        });
    });
});