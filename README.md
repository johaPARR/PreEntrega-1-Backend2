# Johana Aylén Parrello

# Plataforma de Eventos e Inscripciones

API REST desarrollada con Node.js y Express para la gestión de eventos e inscripciones, implementando una arquitectura profesional por capas (Router → Controller → Service → Repository → DAO → Modelo).

Esta pre-entrega corresponde a la base arquitectónica del proyecto final de Backend II: todavía no incluye autenticación completa, roles ni gestión de inscripciones; el objetivo de esta etapa es dejar armada la estructura por capas y la conexión a la base de datos.

## Tecnologías

- Node.js
- Express
- Mongoose (MongoDB)
- Dotenv
- Nodemon (entorno de desarrollo)

## Arquitectura del proyecto

El proyecto sigue una separación en capas para aislar responsabilidades y facilitar el crecimiento del código en las próximas entregas:

- **Routes**: definen los endpoints HTTP y los conectan con su controller correspondiente. No contienen lógica.
- **Controllers**: reciben el `request` y el `response`. Se encargan de leer los datos de entrada y devolver la respuesta HTTP, delegando toda la lógica al service.
- **Services**: contienen la lógica de negocio de cada recurso (validaciones, reglas de dominio). Son el único punto de entrada que usan los controllers para operar sobre los datos.
- **Repositories**: capa intermedia entre el service y el DAO. Desacoplan la lógica de negocio de la implementación concreta de persistencia, de forma que el motor de base de datos se podría cambiar sin tocar los services.
- **DAO (Data Access Object)**: única capa que habla directamente con Mongoose/MongoDB. Contiene las operaciones CRUD puras contra cada modelo.
- **Models**: esquemas de Mongoose que definen la forma de los documentos en la base de datos.
- **Config**: configuración de la conexión a MongoDB (`db.config.js`), leída desde las variables de entorno.
- **Middlewares**: funciones intermedias de la aplicación. Incluye `auth.middleware.js`, que protege rutas verificando el JWT guardado en la cookie de sesión.
- **Utils**: funciones de soporte reutilizables. Incluye `hash.js` (hashing y comparación de contraseñas con bcrypt) y `jwt.js` (firma y verificación de JSON Web Tokens).

Flujo de una request, por ejemplo `GET /api/events`:

Router (events.router.js)
→ Controller (events.controller.js)
→ Service (events.service.js)
→ Repository (events.repository.js)
→ DAO (events.dao.js)
→ Modelo Mongoose (Event.js) → MongoDB


## Instalación

1. Clonar el repositorio.
2. Ejecutar `npm install` para instalar las dependencias.
3. Crear un archivo `.env` en la raíz del proyecto basándose en `src/.env.example`.

## Variables de entorno

| Variable         | Descripción                                        |
|------------------|-----------------------------------------------------|
| `PORT`           | Puerto donde se levanta el servidor                 |
| `NODE_ENV`       | Entorno de ejecución (`development`/`production`)  |
| `MONGO_URL`      | Cadena de conexión a la base de datos MongoDB       |
| `JWT_SECRET`     | Secreto usado para firmar y verificar los JWT       |
| `JWT_EXPIRES_IN` | Tiempo de expiración del JWT (ej: `1h`)             |

## Ejecución

- Modo desarrollo (con recarga automática): `npm run dev`
- Modo producción: `npm start`

Al iniciar, el servidor se conecta primero a MongoDB (usando `MONGO_URL`) y recién después empieza a escuchar peticiones. Si la conexión falla, el proceso se detiene y muestra el error en consola.

## Estructura de carpetas

src/
├── app.js # Configura Express (middlewares, rutas). No levanta el server.
├── server.js # Conecta a MongoDB y levanta el servidor.
├── config/
│ └── db.config.js # Conexión a MongoDB con Mongoose.
├── routes/
│ ├── events.router.js
│ └── sessions.router.js
├── controllers/
│ ├── events.controller.js
│ └── sessions.controller.js
├── services/
│ ├── events.service.js
│ └── sessions.service.js
├── repositories/
│ ├── events.repository.js
│ └── users.repository.js
├── dao/
│ ├── events.dao.js
│ └── users.dao.js
├── models/
│ ├── Event.js
│ └── User.js
├── middlewares/
│ └── auth.middleware.js
└── utils/
├── hash.js
└── jwt.js


## Rutas disponibles

| Método | Ruta                     | Descripción                                          |
|--------|--------------------------|-------------------------------------------------------|
| GET    | `/api/health`            | Comprobación del estado del servidor                  |
| GET    | `/api/events`            | Listado de eventos                                    |
| POST   | `/api/sessions/register` | Registro de usuarios                                  |
| POST   | `/api/sessions/login`    | Login: valida credenciales y setea cookie de sesión   |
| GET    | `/api/sessions/current`  | Devuelve el usuario autenticado (ruta protegida)      |
| POST   | `/api/sessions/logout`   | Cierra la sesión eliminando la cookie                 |

## POST /api/sessions/register

Registra un nuevo usuario. La contraseña se guarda hasheada con bcrypt y nunca se devuelve en la respuesta. El campo `role` siempre se fuerza a `user`, sin importar lo que venga en el body.

**Body esperado (JSON):**
| Campo | Tipo | Obligatorio |
|---|---|---|
| first_name | string | Sí |
| last_name | string | Sí |
| email | string | Sí (formato válido, se normaliza a minúsculas) |
| password | string | Sí (mínimo 6 caracteres) |

**Ejemplo de request:**
\`\`\`json
{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "Ana@Mail.com",
  "password": "Secreta123"
}
\`\`\`

**Respuesta 201 (éxito):**
\`\`\`json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
\`\`\`

**Cómo probarlo:**
1. Levantar el servidor: `npm run dev`
2. Hacer `POST http://localhost:8080/api/sessions/register` con el body de ejemplo.
3. Repetir la misma request: debe responder 409 (email duplicado).
4. Probar sin `password` o con un email sin `@`: debe responder 400.

## POST /api/sessions/login

Valida el email y la contraseña. Si son correctos, genera un JWT con `{ id, email, role }` y lo guarda en una cookie `currentUser` (`httpOnly`, `sameSite: 'lax'`, expiración de 1 hora, `secure` solo en producción). El token nunca se devuelve en el body. Si el email no existe o la contraseña no coincide, responde siempre el mismo mensaje genérico, sin indicar cuál de los dos falló.

**Body esperado (JSON):**
| Campo | Tipo | Obligatorio |
|---|---|---|
| email | string | Sí |
| password | string | Sí |

**Ejemplo de request:**
\`\`\`json
{
  "email": "ana@mail.com",
  "password": "Secreta123"
}
\`\`\`

**Respuesta 200 (éxito, además setea la cookie `currentUser`):**
\`\`\`json
{
  "status": "success",
  "message": "Login correcto"
}
\`\`\`

**Respuesta 401 (credenciales incorrectas):**
\`\`\`json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
\`\`\`

**Cómo probarlo:**
1. Registrar un usuario con `POST /api/sessions/register`.
2. Hacer `POST http://localhost:8080/api/sessions/login` con ese email y password.
3. Verificar que la respuesta trae la cookie `currentUser`.
4. Probar con un email inexistente y con un password incorrecto: ambos deben responder 401 con el mismo mensaje.

## GET /api/sessions/current

Ruta protegida. El middleware `authMiddleware` lee la cookie `currentUser`, verifica el JWT y, si es válido, guarda el payload en `req.user`. Devuelve los datos del usuario autenticado sin el password.

**Respuesta 200 (con cookie válida):**
\`\`\`json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "email": "ana@mail.com",
    "role": "user"
  }
}
\`\`\`

**Respuesta 401 (sin cookie, o token inválido/expirado):**
\`\`\`json
{
  "status": "error",
  "message": "No autenticado"
}
\`\`\`

**Cómo probarlo:**
1. Hacer login primero para obtener la cookie.
2. Hacer `GET http://localhost:8080/api/sessions/current` (la cookie viaja automáticamente en la misma sesión de Thunder Client/Postman).
3. Repetir la request sin la cookie, o modificando el token: debe responder 401.

## POST /api/sessions/logout

Elimina la cookie `currentUser`, cerrando la sesión.

**Respuesta 200:**
\`\`\`json
{
  "status": "success",
  "message": "Sesión cerrada"
}
\`\`\`

**Cómo probarlo:**
1. Hacer login para tener la cookie activa.
2. Hacer `POST http://localhost:8080/api/sessions/logout`.
3. Repetir `GET /api/sessions/current`: debe responder 401, confirmando que la sesión quedó cerrada.