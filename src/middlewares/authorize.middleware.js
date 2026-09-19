// Autorización: recibe los roles permitidos y los compara con req.user.role.
// Uso: authorize('organizer', 'admin')
// Debe ir DESPUÉS de authenticate, porque necesita req.user.
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'No autenticado' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'No tenés permisos para realizar esta acción'
            });
        }

        next();
    };
};