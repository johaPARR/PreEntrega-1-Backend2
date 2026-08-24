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
- **Middlewares**: funciones intermedias de la aplicación (se irán incorporando en próximas entregas: auth, manejo de errores, etc.).

Flujo de una request, por ejemplo `GET /api/events`:

```
Router (events.router.js)
  → Controller (events.controller.js)
    → Service (events.service.js)
      → Repository (events.repository.js)
        → DAO (events.dao.js)
          → Modelo Mongoose (Event.js) → MongoDB
```

## Instalación

1. Clonar el repositorio.
2. Ejecutar `npm install` para instalar las dependencias.
3. Crear un archivo `.env` en la raíz del proyecto basándose en `src/.env.example`.

## Variables de entorno

| Variable     | Descripción                                   |
|--------------|------------------------------------------------|
| `PORT`       | Puerto donde se levanta el servidor            |
| `NODE_ENV`   | Entorno de ejecución (`development`/`production`) |
| `MONGO_URL`  | Cadena de conexión a la base de datos MongoDB  |
| `JWT_SECRET` | Secreto para la futura firma de tokens JWT     |

## Ejecución

- Modo desarrollo (con recarga automática): `npm run dev`
- Modo producción: `npm start`

Al iniciar, el servidor se conecta primero a MongoDB (usando `MONGO_URL`) y recién después empieza a escuchar peticiones. Si la conexión falla, el proceso se detiene y muestra el error en consola.

## Estructura de carpetas

```
src/
├── app.js                       # Configura Express (middlewares, rutas). No levanta el server.
├── server.js                    # Conecta a MongoDB y levanta el servidor.
├── config/
│   └── db.config.js             # Conexión a MongoDB con Mongoose.
├── routes/
│   ├── events.router.js
│   └── sessions.router.js
├── controllers/
│   ├── events.controller.js
│   └── sessions.controller.js
├── services/
│   ├── events.service.js
│   └── sessions.service.js
├── repositories/
│   ├── events.repository.js
│   └── users.repository.js
├── dao/
│   ├── events.dao.js
│   └── users.dao.js
├── models/
│   ├── Event.js
│   └── User.js
├── middlewares/
└── utils/
```

## Rutas disponibles

| Método | Ruta              | Descripción                          |
|--------|-------------------|---------------------------------------|
| GET    | `/api/health`      | Comprobación del estado del servidor |
| GET    | `/api/events`       | Listado de eventos                   |
| POST   | `/api/sessions/login` | Placeholder de login (sin lógica de auth aún) |