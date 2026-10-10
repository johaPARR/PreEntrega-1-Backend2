// DTO de usuario: define qué datos del usuario puede ver el cliente.
// Nunca incluye el password, ni siquiera hasheado.

// Para /register y /current (responden con "id")
export const toUserDTO = (user) => ({
    id: user._id ?? user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
});

// Para el listado de usuarios del admin (responde con "_id", como antes)
export const toUserListItemDTO = (user) => ({
    _id: user._id ?? user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
});