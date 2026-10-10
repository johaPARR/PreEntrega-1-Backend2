// Ruta inexistente -> 404 con el mismo formato que el resto de la API
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
};

// Único lugar donde se arman las respuestas de error de toda la API
export const errorHandler = (err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message;

    // JSON mal formado en el body -> 400
    if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'El body de la petición no es un JSON válido';
    }

    // Mongoose: validación del schema fallida -> 400
    if (err.name === 'ValidationError') {
        status = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    }

    // Mongoose: id con formato inválido -> 400
    if (err.name === 'CastError') {
        status = 400;
        message = 'El identificador enviado no es válido';
    }

    // MongoDB: dato duplicado (índice único) -> 409
    if (err.code === 11000) {
        status = 409;
        message = 'Ya existe un registro con esos datos';
    }

    // Error inesperado: se registra en el servidor y no se expone el detalle al cliente
    if (status >= 500) {
        console.error(err);
        message = 'Error interno del servidor';
    }

    res.status(status).json({ status: 'error', message });
};