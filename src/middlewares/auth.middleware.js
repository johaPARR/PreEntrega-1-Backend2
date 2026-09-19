import passport from 'passport';

// Autenticación: verifica que haya una sesión válida (JWT en la cookie).
// Sin sesión responde 401. Con sesión deja al usuario en req.user.
export const authenticate = (req, res, next) => {
    passport.authenticate('current', { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'No autenticado' });
        }
        req.user = user;
        next();
    })(req, res, next);
};