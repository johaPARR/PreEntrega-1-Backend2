import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import sessionsService from '../services/sessions.service.js';

// Extrae el JWT desde la cookie 'currentUser' en vez del header Authorization
const cookieExtractor = (req) => {
    return req?.cookies?.currentUser || null;
};

// --- Estrategia 'register' ---
// Solo extrae los datos del request. Las validaciones están en sessions.service.js
passport.use('register', new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
    async (req, email, password, done) => {
        try {
            const { first_name, last_name } = req.body;

            const newUser = await sessionsService.register({ first_name, last_name, email, password });
            return done(null, newUser);
        } catch (error) {
            if (error.status && error.status < 500) {
                return done(null, false, { status: error.status, message: error.message });
            }
            return done(error);
        }
    }
));

// --- Estrategia 'login' ---
// Solo valida credenciales. El JWT y la cookie los genera el controller.
passport.use('login', new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
        try {
            if (!email || !password) {
                return done(null, false, { message: 'Credenciales inválidas' });
            }

            const user = await sessionsService.validateCredentials(email, password);
            if (!user) {
                return done(null, false, { message: 'Credenciales inválidas' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// --- Estrategia 'current' ---
// secretOrKeyProvider (en vez de secretOrKey) lee JWT_SECRET recién en
// tiempo de request, evitando el mismo bug de orden con dotenv que
// ya resolvimos antes en jwt.js.
passport.use('current', new JwtStrategy(
    {
        jwtFromRequest: cookieExtractor,
        secretOrKeyProvider: (req, rawJwtToken, done) => {
            done(null, process.env.JWT_SECRET);
        }
    },
    async (payload, done) => {
        try {
            return done(null, payload);
        } catch (error) {
            return done(error);
        }
    }
));

// ============================================================================
// PREPARACIÓN PARA FUTURAS ESTRATEGIAS (OAuth Providers: Google, GitHub, etc.)
// Al centralizar todas las estrategias en este archivo, cualquier nuevo provider
// externo se registra aquí con `passport.use('google', ...)` o `passport.use('github', ...)`
// sin necesidad de modificar app.js ni tocar la configuración global del servidor.
// ============================================================================
export default passport;