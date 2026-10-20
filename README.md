# NexAirline

NexAirline es una interfaz de reserva de vuelos construida con React, TypeScript y Vite. Incluye búsqueda de rutas, selección de tipo de viaje, filtros de cabina y selección interactiva de vuelos.

## Desarrollo

```bash
npm install
```

La aplicación utiliza `VITE_API_URL` como URL base obligatoria del backend.
El archivo `.env` local apunta directamente a `http://localhost:8080`, que es el backend
activo en este entorno. No hay una URL de backend escondida en la configuración de Vite.

```bash
cp .env.example .env.local
npm run dev
```

Si `.env` no existe en una instalación nueva, copia `.env.example` como `.env` o `.env.local`
y configura la URL correspondiente antes de iniciar la aplicación.

En producción, configura `VITE_API_URL` en el proveedor de hosting antes de ejecutar el build:

```env
VITE_API_URL=https://api.example.com
```

También puedes usar `VITE_API_URL=/api` si el backend se publica bajo la misma URL mediante un
proxy inverso. Las variables `VITE_*` se incorporan al frontend durante el build, por lo que no
deben contener contraseñas, tokens privados ni otras credenciales secretas.

## Comprobaciones

```bash
npm run lint
npm run build
```

La aplicación se sirve por defecto en `http://localhost:5173`.
