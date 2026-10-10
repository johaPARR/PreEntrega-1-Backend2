// DTO de evento: define qué datos del evento (y de su organizador) ve el cliente.
// El organizador puede venir como id (sin populate) o como documento (con populate):
// en ese caso solo se exponen nombre y email, nunca otros campos.
const toOrganizerDTO = (organizer) => {
    if (!organizer) return organizer;
    if (organizer.email === undefined && organizer.first_name === undefined) {
        return organizer; // viene solo el id
    }
    return {
        _id: organizer._id ?? organizer.id,
        first_name: organizer.first_name,
        last_name: organizer.last_name,
        email: organizer.email
    };
};

export const toEventDTO = (event) => ({
    _id: event._id ?? event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    location: event.location,
    capacity: event.capacity,
    reservedSeats: event.reservedSeats ?? 0,
    price: event.price,
    status: event.status,
    organizer: toOrganizerDTO(event.organizer),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
});