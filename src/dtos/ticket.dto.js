// DTO de ticket: define qué datos del ticket ve el cliente.
// Si el ticket viene con populate, el usuario y el evento relacionados
// también se filtran: del usuario nunca sale el password ni otros datos sensibles.
const toRelatedUserDTO = (user) => {
    if (!user) return user;
    if (user.email === undefined && user.first_name === undefined) {
        return user; // viene solo el id
    }
    return {
        _id: user._id ?? user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
    };
};

const toRelatedEventDTO = (event) => {
    if (!event) return event;
    if (event.title === undefined) {
        return event; // viene solo el id
    }
    return {
        _id: event._id ?? event.id,
        title: event.title,
        date: event.date,
        location: event.location
    };
};

export const toTicketDTO = (ticket) => ({
    _id: ticket._id ?? ticket.id,
    user: toRelatedUserDTO(ticket.user),
    event: toRelatedEventDTO(ticket.event),
    quantity: ticket.quantity,
    status: ticket.status,
    reservationCode: ticket.reservationCode,
    createdAt: ticket.createdAt,
    cancelledAt: ticket.cancelledAt
});