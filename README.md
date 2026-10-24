# NexAirline

NexAirline es una interfaz de reserva de vuelos construida con React, TypeScript y Vite. Incluye búsqueda de rutas, selección de tipo de viaje, filtros de cabina y selección interactiva de vuelos.

## Integraciones realizadas

La aplicación se integra con el backend mediante un cliente HTTP centralizado y servicios
tipados por dominio. Las integraciones disponibles en los flujos operativos incluyen:

- **Vuelos y configuración operacional:** consulta, creación y actualización de vuelos,
  aerolíneas, aeropuertos, rutas, terminales, puertas, aeronaves, tipos de asiento y asientos.
- **Mapa de precios y disponibilidad:** carga de vuelos, aeronaves y configuración de asientos,
  inicialización de inventario por vuelo y actualización masiva de precios.
- **Despacho y venta de mostrador:** consulta de inventario vuelo-asiento, check-in, cambios de
  estado, búsqueda y creación de clientes, reservas temporales y ventas de emergencia con métodos
  de pago.
- **Reservas y reasignaciones:** consulta y cancelación de reservas, edición de pasajeros y
  reasignaciones individuales o masivas.
- **Pagos:** consulta paginada con filtros, visualización de detalle, actualización de estado y
  catálogo activable de métodos de pago.
- **Auditoría y seguridad:** visualización y exportación del historial de cambios y consulta de
  errores de seguridad desde los módulos correspondientes.
- **Fechas y preferencias regionales:** las pantallas operativas, pagos, reservas, auditoría,
  seguridad y vuelos formatean fechas y horas según la zona horaria configurada por el usuario.

Los servicios se encuentran en `src/services` y usan `VITE_API_URL` como base del backend. Los
errores de las operaciones se muestran en la interfaz para que el usuario pueda identificar si
una integración no está disponible o si la solicitud fue rechazada.

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
