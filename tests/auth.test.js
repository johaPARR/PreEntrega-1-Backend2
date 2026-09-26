import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import eventsService from '../src/services/events.service.js';
import usersService from '../src/services/users.service.js';

// Usamos el secreto de test o el definido en entorno
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.JWT_SECRET = TEST_JWT_SECRET;

const createToken = (payload) => {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
};

describe('Tests Automatizados — Pre-entrega 5: Roles y Autorización', () => {
    const userPayload = { id: '665f2a111111111111111111', email: 'user@test.com', role: 'user' };
    const organizerPayload = { id: '665f2a222222222222222222', email: 'org@test.com', role: 'organizer' };
    const adminPayload = { id: '665f2a333333333333333333', email: 'admin@test.com', role: 'admin' };

    const userToken = createToken(userPayload);
    const organizerToken = createToken(organizerPayload);
    const adminToken = createToken(adminPayload);

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('1. Autenticación (401 si no hay sesión válida)', () => {
        test('Cualquier ruta privada sin cookie responde 401', async () => {
            const res = await request(app)
                .get('/api/users');

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No autenticado');
        });

        test('POST /api/events sin cookie responde 401', async () => {
            const res = await request(app)
                .post('/api/events')
                .send({ title: 'Evento', date: '2026-10-10' });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No autenticado');
        });
    });

    describe('2. Creación de eventos (POST /api/events)', () => {
        test('Usuario con rol "user" recibe 403 (No tenés permisos para realizar esta acción)', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Cookie', [`currentUser=${userToken}`])
                .send({ title: 'Mi evento', date: '2026-10-10' });

            expect(res.status).toBe(403);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No tenés permisos para realizar esta acción');
        });

        test('Usuario con rol "organizer" crea el evento con éxito (201)', async () => {
            const mockCreatedEvent = {
                _id: '6690aabbccddeeff00112233',
                title: 'Conferencia Tech 2026',
                date: '2026-11-15',
                status: 'active',
                organizer: organizerPayload.id
            };

            jest.spyOn(eventsService, 'createEvent').mockResolvedValue(mockCreatedEvent);

            const res = await request(app)
                .post('/api/events')
                .set('Cookie', [`currentUser=${organizerToken}`])
                .send({ title: 'Conferencia Tech 2026', date: '2026-11-15' });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.payload).toHaveProperty('id', mockCreatedEvent._id);
            expect(res.body.payload.title).toBe('Conferencia Tech 2026');
            expect(res.body.payload.organizer).toBe(organizerPayload.id);
        });
    });

    describe('3. Ruta administrativa de usuarios (GET /api/users)', () => {
        test('Usuario con rol "user" recibe 403', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Cookie', [`currentUser=${userToken}`]);

            expect(res.status).toBe(403);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No tenés permisos para realizar esta acción');
        });

        test('Usuario con rol "organizer" recibe 403', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Cookie', [`currentUser=${organizerToken}`]);

            expect(res.status).toBe(403);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No tenés permisos para realizar esta acción');
        });

        test('Usuario con rol "admin" recibe 200 y la lista de usuarios', async () => {
            const mockUsers = [
                { _id: '665f2a111111111111111111', first_name: 'Juan', last_name: 'Pérez', email: 'user@test.com', role: 'user' },
                { _id: '665f2a222222222222222222', first_name: 'Org', last_name: 'Demo', email: 'org@test.com', role: 'organizer' }
            ];

            jest.spyOn(usersService, 'getUsers').mockResolvedValue(mockUsers);

            const res = await request(app)
                .get('/api/users')
                .set('Cookie', [`currentUser=${adminToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.payload).toEqual(mockUsers);
            // Verificar que no se exponga la contraseña
            res.body.payload.forEach(u => expect(u.password).toBeUndefined());
        });
    });

    describe('4. Propiedad de recursos (PUT /api/events/:id)', () => {
        test('Organizer intentando modificar evento ajeno recibe 403', async () => {
            const otherOrganizerId = '665f2a999999999999999999';
            const mockEvent = {
                _id: '66901234567890abcdef1234',
                title: 'Evento de Otro',
                date: '2026-10-10',
                status: 'active',
                organizer: otherOrganizerId
            };

            jest.spyOn(eventsService, 'getEventById').mockResolvedValue(mockEvent);

            const res = await request(app)
                .put(`/api/events/${mockEvent._id}`)
                .set('Cookie', [`currentUser=${organizerToken}`])
                .send({ title: 'Hackeo de Evento' });

            expect(res.status).toBe(403);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('No podés modificar un evento que no es tuyo');
        });

        test('Organizer modificando su propio evento recibe 200', async () => {
            const ownEvent = {
                _id: '66901234567890abcdef1234',
                title: 'Mi Evento Original',
                date: '2026-10-10',
                status: 'active',
                organizer: organizerPayload.id
            };

            const updatedEvent = { ...ownEvent, title: 'Mi Evento Modificado' };

            jest.spyOn(eventsService, 'getEventById')
                .mockResolvedValueOnce(ownEvent)
                .mockResolvedValueOnce(updatedEvent);
            jest.spyOn(eventsService, 'updateEvent').mockResolvedValue({});

            const res = await request(app)
                .put(`/api/events/${ownEvent._id}`)
                .set('Cookie', [`currentUser=${organizerToken}`])
                .send({ title: 'Mi Evento Modificado' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.payload.title).toBe('Mi Evento Modificado');
        });
    });
});
