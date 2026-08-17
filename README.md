# Nombre: Johana Aylén Parrello

# Plataforma de Eventos
API REST desarrollada con Node.js y Express para la gestión de eventos e inscripciones, implementando una arquitectura profesional por capas.

## Tecnologías
Node.js, Express, Mongoose, Dotenv, Nodemon.

## Instalación
1. Clonar el repositorio.
2. Ejecutar `npm install` para instalar las dependencias.
3. Crear un archivo `.env` en la raíz basándose en el archivo `.env.example`.

## Ejecución
- Modo desarrollo: `npm run dev`

## Estructura de carpetas
- `src/config/`: Configuración de base de datos y variables.
- `src/controllers/`: Controladores con la lógica de los endpoints.
- `src/dao/`: Capa de persistencia de datos.
- `src/middlewares/`: Funciones middleware de la aplicación.
- `src/models/`: Esquemas de Mongoose.
- `src/routes/`: Definición de rutas de la API.
- `src/services/`: Lógica de negocio.

## Rutas principales
- `GET /api/health`: Comprobación del estado del servidor.
- `GET /api/events`: Listado de eventos.