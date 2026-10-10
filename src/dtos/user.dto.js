// DTO de usuario: define qué datos del usuario puede ver el cliente.
// Nunca incluye el password, ni siquiera hasheado.
export const toUserDTO = (user) => ({
    id: user._id ?? user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
});