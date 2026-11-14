# NexAirline - Documentación de carga de datos, rutas y lógica operativa

## 1. Propósito y alcance

Este documento describe cómo NexAirline captura, transforma, valida y envía los
datos al backend. Incluye:

- configuración de conexión;
- autenticación y sesión;
- rutas de navegación de la aplicación;
- endpoints HTTP utilizados;
- campos y tipos esperados por cada operación;
- orden recomendado para cargar catálogos y datos operativos;
- relaciones entre entidades;
- estados permitidos y transiciones principales;
- reglas de validación visibles en el frontend;
- respuestas, errores y comportamiento ante una sesión expirada;
- ejemplos de cuerpos JSON;
- diferencias entre datos de demostración y datos realmente persistidos.

### Advertencia importante sobre la base de datos

Este repositorio contiene el **frontend** de NexAirline. No contiene migraciones,
modelos ORM, scripts SQL ni controladores del backend. Por lo tanto:

1. El frontend **no se conecta directamente a PostgreSQL, MySQL u otra base de
   datos**.
2. Todas las altas, modificaciones, consultas y acciones operativas se realizan
   mediante HTTP contra el backend configurado en `VITE_API_URL`.
3. Las interfaces TypeScript y los DTO de `src/services` representan el contrato
   que el frontend utiliza; el backend es la autoridad final sobre restricciones,
   claves foráneas, unicidad, transacciones y permisos.
4. Los archivos [`src/data1.ts`](./src/data1.ts),
   [`src/data2.ts`](./src/data2.ts) y [`src/data3.ts`](./src/data3.ts) contienen
   datos semilla/mock de presentación. Editarlos **no inserta registros en la
   base de datos**.

Para documentar el esquema físico exacto de la base de datos todavía se necesita
el repositorio o contrato del backend. Esta guía documenta completamente lo que
el frontend envía y las reglas que deben respetarse para que el backend pueda
persistirlo correctamente.

---

## 2. Arquitectura de datos

```text
Usuario
  |
  | POST /login
  v
Frontend React/Vite
  |
  | cliente HTTP src/services/api.ts
  | Authorization: Bearer <token>
  v
Backend API (VITE_API_URL)
  |
  | validación, autorización, transacciones
  v
Base de datos
```

La capa común está implementada en
[`src/services/api.ts`](./src/services/api.ts):

- agrega el prefijo `VITE_API_URL`;
- serializa los cuerpos como JSON;
- agrega el token guardado en `localStorage`;
- interpreta respuestas JSON o texto;
- convierte respuestas HTTP no exitosas en `ApiError`;
- ante `401`, elimina la sesión y redirige a `/login`.

La aplicación inicia comprobando `GET /vuelo`. Si el backend no responde o
devuelve un error 5xx, muestra la pantalla de backend no disponible y no permite
operar hasta reintentar correctamente.

## 3. Configuración de conexión

Archivo de referencia: [`.env.example`](./.env.example).

```env
VITE_API_URL=https://fly.astracode.org/api
```

En desarrollo:

```bash
cp .env.example .env.local
npm install
npm run dev
```

El valor puede ser una URL absoluta o un prefijo relativo, por ejemplo:

```env
VITE_API_URL=http://localhost:8080
VITE_API_URL=http://localhost:8080/api
VITE_API_URL=/api
```

Las variables `VITE_*` se incorporan al bundle del navegador. No deben contener
contraseñas, secretos, claves privadas ni tokens administrativos.

---

## 4. Autenticación y sesión

### 4.1 Inicio de sesión

La pantalla [`src/pages/Login.tsx`](./src/pages/Login.tsx) recibe:

| Campo visual | Campo enviado | Tipo | Obligatorio |
|---|---|---:|:---:|
| Usuario | `nombreUsuario` | `string` | Sí |
| Contraseña | `password` | `string` | Sí |

Solicitud:

```http
POST /login
Content-Type: application/json
```

```json
{
  "nombreUsuario": "usuario.operaciones",
  "password": "contraseña"
}
```

Respuesta esperada:

```json
{
  "access_token": "jwt-o-token",
  "token_type": "Bearer",
  "usuario": {
    "id": 2,
    "nombre": "Luis",
    "rol_id": 2
  }
}
```

El frontend guarda:

- `access_token` en `localStorage` con la clave `nexairline_token`;
- el objeto `usuario` serializado con la clave `nexairline_user`.

### 4.2 Uso del token

Las peticiones posteriores incluyen:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

El backend debe:

- validar firma, expiración y emisor del token;
- verificar que el usuario esté activo;
- autorizar cada operación por rol;
- responder `401` cuando el token sea inválido o haya expirado;
- responder `403` cuando el usuario esté autenticado pero no autorizado.

### 4.3 Roles funcionales

Los roles mostrados en los datos de demostración son:

| Rol | Responsabilidad |
|---|---|
| Administrador | Acceso total, usuarios, roles y configuración |
| Operaciones | Vuelos, puertas, aeronaves, asientos y despacho |
| Ventas | Reservas, clientes, boletos y pagos |
| Auditor | Consulta de bitácoras y operaciones de solo lectura |

La interfaz restringe `/seguridad/roles` a administrador. Esta restricción visual
no sustituye la autorización del backend.

---

## 5. Rutas de navegación del frontend

Estas son rutas del navegador, no endpoints de base de datos:

| Ruta | Uso |
|---|---|
| `/login` | Inicio de sesión |
| `/operaciones/dashboard` | Resumen operativo |
| `/operaciones/vuelos` | Listado y edición de vuelos |
| `/vuelos/nuevo` | Asistente de creación de vuelos |
| `/vuelos/:vueloId/asientos` | Precios e inventario del vuelo |
| `/vuelos/:vueloId/despacho` | Despacho, check-in y venta de mostrador |
| `/operaciones/reasignaciones` | Reasignación por cancelación |
| `/flota/aviones` | Aerolíneas, aeronaves y tipos de asiento |
| `/flota/mapa-asientos` | Consulta del mapa de cabina |
| `/flota/cabina/nueva/:avionId` | Generación masiva de cabina |
| `/infraestructura/catalogos` | Aeropuertos, terminales, rutas y puertas |
| `/ventas/reservas` | Consulta, cancelación y edición de pasajeros |
| `/ventas/pagos` | Conciliación de pagos |
| `/seguridad/roles` | Usuarios y roles; solo administrador |
| `/seguridad/bitacora` | Auditoría de asientos |

`/dashboard`, `/vuelos`, `/reservas`, `/pagos`, `/asientos`, `/roles` y
`/bitacora` son alias que redirigen a las rutas nuevas.

---

## 6. Convenciones de datos

### 6.1 Identificadores

- Los IDs se envían como enteros positivos.
- Las relaciones se envían como `...Id`, por ejemplo `aeropuertoId`,
  `aerolineaId`, `rutaId`, `avionId`.
- Nunca se debe enviar el nombre de una entidad relacionada cuando el DTO espera
  su ID.
- La generación de IDs debe pertenecer al backend/base de datos; el frontend no
  genera IDs para registros persistidos.

### 6.2 Fechas y horas

- Los formularios de fecha/hora utilizan valores locales.
- Antes de enviar vuelos, el frontend convierte la fecha a ISO mediante
  `toISOString()`.
- La pantalla de creación utiliza explícitamente el offset `-06:00`
  (zona horaria de Guatemala).
- La API debe guardar instantes en UTC o aplicar una política de zona horaria
  consistente; no debe interpretar una fecha ISO dos veces.

Ejemplo enviado:

```json
{
  "fechaSalida": "2026-10-20T14:00:00.000Z",
  "fechaLlegada": "2026-10-20T16:00:00.000Z"
}
```

### 6.3 Nombres

El backend debe aceptar exactamente los nombres del DTO. Hay respuestas que el
frontend normaliza por compatibilidad (`numero_vuelo`/`numeroVuelo`,
`avion_id`/`avionId`), pero las solicitudes deben usar el formato documentado
por cada servicio.

### 6.4 Estados

Los estados son valores cerrados y deben validarse con enumeraciones en el
backend. No se recomienda guardar etiquetas traducidas como estado.

---

## 7. Orden recomendado para cargar datos

El orden evita referencias inexistentes y permite que cada pantalla tenga los
catálogos necesarios:

### Fase 0 - Seguridad

1. Crear roles.
2. Crear el primer usuario administrador.
3. Crear usuarios operativos y de ventas.
4. Verificar inicio de sesión y permisos.

### Fase 1 - Catálogos maestros

1. Aerolíneas.
2. Aeropuertos.
3. Tipos de asiento.
4. Métodos de pago.

### Fase 2 - Infraestructura

1. Terminales, usando un `aeropuertoId` existente.
2. Puertas de embarque, usando el identificador de terminal/sede válido.
3. Rutas, usando dos aeropuertos existentes y distintos.

### Fase 3 - Flota

1. Aviones, usando una aerolínea existente.
2. Cabina/asientos de cada avión.
3. Validar que el número de asientos no exceda la capacidad del avión.

### Fase 4 - Operación aérea

1. Crear vuelos, usando aerolínea, aeronave, ruta y puerta existentes.
2. Verificar disponibilidad de la aeronave para el intervalo.
3. Inicializar inventario vuelo-asiento.
4. Asignar precios a los asientos disponibles.

### Fase 5 - Comercial

1. Registrar o buscar clientes.
2. Reservar temporalmente un asiento.
3. Crear reserva/venta usando el inventario reservado.
4. Registrar o actualizar el pago.
5. Emitir boleto y código de check-in.

### Fase 6 - Operación posterior

1. Check-in.
2. Cambios de estado del asiento.
3. Cancelaciones.
4. Reasignaciones.
5. Auditoría y conciliación.

---

## 8. Catálogo de endpoints y cuerpos de datos

Todas las rutas siguientes se concatenan con `VITE_API_URL`. Por ejemplo, si la
base es `https://servidor/api`, `POST /avion` se convierte en
`https://servidor/api/avion`.

### 8.1 Dashboard

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/dashboard/resumen` | Indicadores, recaudación y próximas salidas |

La respuesta debe incluir, directamente o dentro de `data`:

```json
{
  "vuelos_activos": 12,
  "vuelos_abordando": 2,
  "vuelos_en_ruta": 4,
  "pasajeros_hoy": 180,
  "reservas_hoy": 65,
  "aviones_mantenimiento": 2,
  "total_aviones": 8,
  "mantenimiento_alertas": 1,
  "recaudacion_aprobada": 12500.5,
  "proximas_salidas": []
}
```

### 8.2 Aerolíneas

Servicio: [`src/services/airlineService.ts`](./src/services/airlineService.ts).

| Método | Ruta | DTO |
|---|---|---|
| `GET` | `/aerolinea` | - |
| `POST` | `/aerolinea` | `CreateAirlineDTO` |
| `PUT` | `/aerolinea/:id` | `UpdateAirlineDTO` |

Alta:

```json
{
  "nombre": "AstraCode Air",
  "codigoIata": "AX",
  "codigoIcao": "ANX",
  "pais": "Guatemala"
}
```

Actualización agrega `activo`:

```json
{
  "nombre": "AstraCode Air",
  "codigoIata": "AX",
  "codigoIcao": "ANX",
  "pais": "Guatemala",
  "activo": true
}
```

Reglas recomendadas: IATA de 2 caracteres para aerolínea, ICAO de 3, códigos
únicos y no eliminar físicamente una aerolínea referenciada; utilizar `activo`.

### 8.3 Aeropuertos

Servicio: [`src/services/airportService.ts`](./src/services/airportService.ts).

| Método | Ruta | DTO |
|---|---|---|
| `GET` | `/aeropuerto` | - |
| `POST` | `/aeropuerto` | `CreateAirportDTO` |
| `PUT` | `/aeropuerto/:id` | `UpdateAirportDTO` |

```json
{
  "nombre": "Aeropuerto Internacional La Aurora",
  "codigoIata": "GUA",
  "codigoIcao": "MGGT",
  "ciudad": "Ciudad de Guatemala",
  "pais": "Guatemala",
  "direccion": "Av. Hincapié, Zona 13"
}
```

`activo` se utiliza en actualización. Validar IATA de 3 caracteres, ICAO de 4,
unicidad de ambos códigos y evitar que el origen y destino de una ruta sean el
mismo aeropuerto.

### 8.4 Terminales

Servicio: [`src/services/terminalService.ts`](./src/services/terminalService.ts).

| Método | Ruta | DTO |
|---|---|---|
| `GET` | `/terminal` | - |
| `POST` | `/terminal` | `CreateTerminalDTO` |
| `PUT` | `/terminal/:id` | `UpdateTerminalDTO` |

```json
{
  "aeropuertoId": 1,
  "nombre": "Terminal Norte",
  "descripcion": "Vuelos regionales y centroamericanos"
}
```

En actualización se agrega `activo`. El aeropuerto relacionado debe existir.

### 8.5 Puertas de embarque

Servicio: [`src/services/gateService.ts`](./src/services/gateService.ts).

| Método | Ruta | DTO |
|---|---|---|
| `GET` | `/puerta-embarque` | - |
| `POST` | `/puerta-embarque` | `CreateGateDTO` |
| `PUT` | `/puerta-embarque/:id` | `UpdateGateDTO` |

```json
{
  "sedeId": 1,
  "numero": "A4",
  "descripcion": "Embarque remoto con bus"
}
```

El frontend llama al campo `sedeId`, aunque la pantalla lo presenta asociado a
la terminal. El backend debe confirmar si `sedeId` referencia una terminal,
sede u otra entidad; no se debe cambiar este nombre sin actualizar ambos lados.

### 8.6 Rutas aéreas

Servicio: [`src/services/routeService.ts`](./src/services/routeService.ts).

| Método | Ruta | DTO |
|---|---|---|
| `GET` | `/ruta` | - |
| `POST` | `/ruta` | `CreateRouteDTO` |
| `PUT` | `/ruta/:id` | `UpdateRouteDTO` |

```json
{
  "aeropuertoOrigenId": 1,
  "aeropuertoDestinoId": 2,
  "duracionEstimada": 110,
  "distancia": 1190
}
```

En actualización se agrega `activa`:

```json
{
  "aeropuertoOrigenId": 1,
  "aeropuertoDestinoId": 2,
  "duracionEstimada": 110,
  "distancia": 1190,
  "activa": true
}
```

Reglas:

- `duracionEstimada` está expresada en minutos;
- `distancia` utiliza la unidad definida por el negocio, presumiblemente
  kilómetros; debe documentarse en el backend;
- origen y destino deben existir y ser diferentes;
- una ruta inactiva no debe poder seleccionarse para programar vuelos;
- conviene imponer unicidad de la combinación origen-destino.

### 8.7 Aeronaves

Servicio: [`src/services/planeService.ts`](./src/services/planeService.ts).

| Método | Ruta | Parámetros/cuerpo |
|---|---|---|
| `GET` | `/avion` | - |
| `GET` | `/avion/disponibles?salida=...&llegada=...` | ISO de salida y llegada |
| `POST` | `/avion` | `CreatePlaneDTO` |
| `PUT` | `/avion/:id` | `UpdatePlaneDTO` |

```json
{
  "aerolineaId": 1,
  "matricula": "N-AX101",
  "nombre": "Airbus A320neo",
  "capacidad": 180
}
```

Actualización agrega `activo`. Validar matrícula única, capacidad positiva y
que la aerolínea exista. Una aeronave en mantenimiento o inactiva no debe estar
disponible para un vuelo nuevo.

`/avion/disponibles` debe excluir aeronaves que:

- estén inactivas;
- estén en mantenimiento durante el intervalo;
- ya estén asignadas a otro vuelo solapado;
- no cumplan la capacidad mínima necesaria, si el negocio la aplica.

### 8.8 Tipos de asiento

Servicio: [`src/services/seatTypeService.ts`](./src/services/seatTypeService.ts).

| Método | Ruta | DTO |
|---|---|---|
| `GET` | `/tipo-asiento` | - |
| `POST` | `/tipo-asiento` | `CreateSeatTypeDTO` |
| `PUT` | `/tipo-asiento/:id` | `UpdateSeatTypeDTO` |

```json
{
  "nombre": "Premium",
  "descripcion": "Asiento ampliado con embarque prioritario"
}
```

### 8.9 Asientos y configuración de cabina

Servicio: [`src/services/seatService.ts`](./src/services/seatService.ts).

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/asiento` | Todos los asientos |
| `GET` | `/asiento?avionId=1` | Asientos de una aeronave |
| `POST` | `/asiento` | Crear un asiento |
| `POST` | `/asiento/bulk` | Crear una cabina completa |
| `PUT` | `/asiento/:id` | Actualizar asiento |
| `DELETE` | `/asiento/avion/:avionId` | Eliminar/reformatear cabina |

Alta individual:

```json
{
  "avionId": 1,
  "tipoAsientoId": 2,
  "numero": "12A",
  "fila": 12,
  "letra": "A"
}
```

Alta masiva: el cuerpo es un arreglo de objetos con la misma estructura:

```json
[
  {
    "avionId": 1,
    "tipoAsientoId": 2,
    "numero": "1A",
    "fila": 1,
    "letra": "A"
  },
  {
    "avionId": 1,
    "tipoAsientoId": 2,
    "numero": "1B",
    "fila": 1,
    "letra": "B"
  }
]
```

Actualización agrega `activo`. La pantalla de configuración primero ejecuta
`DELETE /asiento/avion/:avionId` y luego `POST /asiento/bulk`; el backend debe
tratar esta operación como una acción protegida y transaccional, porque una
falla entre ambos pasos puede dejar la cabina incompleta.

Validaciones mínimas:

- el avión y tipo de asiento deben existir;
- `fila` debe ser positiva;
- `letra` debe tener formato válido;
- `numero` debe ser único dentro del avión;
- el total de asientos activos no debe superar la capacidad;
- no permitir regenerar la cabina si existen vuelos o ventas dependientes, o
  exigir una política explícita de bloqueo/migración.

### 8.10 Vuelos

Servicio: [`src/services/flightService.ts`](./src/services/flightService.ts).

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/vuelo` | Listado |
| `GET` | `/vuelo?estado=PROGRAMADO` | Filtrar por estado |
| `GET` | `/vuelo?ruta_id=1` | Filtrar por ruta |
| `GET` | `/vuelo?page=1&limit=20` | Listado paginado |
| `GET` | `/vuelo/:id` | Detalle |
| `POST` | `/vuelo` | Crear |
| `PUT` | `/vuelo/:id` | Actualizar |

Alta:

```json
{
  "aerolineaId": 1,
  "avionId": 1,
  "rutaId": 1,
  "puertaEmbarqueId": 3,
  "numeroVuelo": "AX 204",
  "fechaSalida": "2026-10-20T14:20:00.000Z",
  "fechaLlegada": "2026-10-20T16:10:00.000Z",
  "estado": "PROGRAMADO"
}
```

Estados permitidos:

```text
PROGRAMADO
ABORDANDO
EN_VUELO
FINALIZADO
CANCELADO
```

Reglas de frontend/backend:

- ruta, avión y aerolínea son obligatorios;
- la fecha de llegada debe ser posterior a la salida;
- el asistente calcula inicialmente la llegada con
  `duracionEstimada * 60_000`;
- se consulta disponibilidad de aeronaves antes de confirmar;
- puerta y aeronave deben existir y estar activas;
- número de vuelo debe tener una política de unicidad para el mismo periodo;
- no debe existir solapamiento de la aeronave;
- la programación debe respetar la capacidad de la cabina;
- al crear el vuelo, se debe inicializar su inventario de asientos.

### 8.11 Inventario vuelo-asiento y precios

Servicio: [`src/services/vueloAsientoService.ts`](./src/services/vueloAsientoService.ts).

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/vuelo-asiento?vueloId=1` | Inventario del vuelo |
| `POST` | `/vuelo-asiento/init` | Generar inventario |
| `PUT` | `/vuelo-asiento/bulk-price` | Precio masivo |

Inicialización:

```json
{
  "vueloId": 1
}
```

Precio masivo:

```json
{
  "vueloId": 1,
  "asientoIds": [101, 102, 103],
  "precio": 185.5
}
```

Estados de inventario comercial:

```text
DISPONIBLE
BLOQUEADO
CONFIRMADO
```

En despacho también pueden aparecer:

```text
RESERVADO
OCUPADO
CHECKED_IN
RESERVADO_TEMPORAL
```

El backend debe impedir asignar precios negativos, modificar asientos de otro
vuelo o cambiar un asiento vendido sin una operación de cancelación/reembolso
formal.

### 8.12 Clientes y venta de mostrador

Servicio: [`src/services/despachoService.ts`](./src/services/despachoService.ts).

Buscar clientes:

```http
GET /cliente/buscar?q=lucia
```

Crear cliente:

```http
POST /cliente
```

```json
{
  "nombre": "Lucía",
  "apellido": "Hernández",
  "correo": "lucia@example.com",
  "telefono": "+50255555555",
  "contrasena": "Nex#2026Temp"
}
```

El teléfono es opcional; nombre, apellido y correo son obligatorios en la
interfaz. La contraseña temporal mostrada en el código debe reemplazarse en el
backend por una estrategia segura de activación o cambio obligatorio si el
cliente representa una cuenta real.

Reservar/liberar asiento:

```http
POST /vuelo-asiento/:asientoId/reservar-temporal
POST /vuelo-asiento/:asientoId/liberar-temporal
```

Ambos utilizan cuerpo vacío `{}`. El backend debe manejar expiración,
concurrencia y liberación automática de reservas temporales.

Venta de mostrador:

```http
POST /ventas/mostrador
```

```json
{
  "vuelo_id": 1,
  "vuelo_asiento_id": 501,
  "cliente_id": 25,
  "pasajero": {
    "nombre": "Lucía",
    "apellido": "Hernández",
    "tipo_documento": "DPI",
    "numero_documento": "2456812340101"
  },
  "pago": {
    "metodo_pago_id": 1,
    "monto": 185,
    "referencia": "VISA-MOSTRADOR-1760000000000"
  }
}
```

Esta operación debe ser transaccional:

1. verificar vuelo, asiento, cliente y método de pago;
2. verificar que el asiento esté disponible o reservado por el operador;
3. crear/actualizar reserva;
4. crear el detalle de pasajero;
5. registrar pago;
6. cambiar el inventario a confirmado/ocupado;
7. emitir boleto y código de check-in;
8. registrar auditoría.

Si un paso falla, no se debe dejar el asiento vendido sin pago ni un pago sin
boleto.

### 8.13 Check-in y despacho

| Método | Ruta | Cuerpo |
|---|---|---|
| `POST` | `/checkin` | `{ "codigo_checkin": "K7M2QD" }` |
| `PATCH` | `/vuelo-asiento/:asientoId/estado` | estado y descripción |

Check-in:

```json
{
  "codigo_checkin": "K7M2QD"
}
```

Cambio manual:

```json
{
  "nuevo_estado": "BLOQUEADO",
  "descripcion": "Reposabrazos dañado"
}
```

El frontend solo permite check-in operativo para asientos confirmados. El
backend debe repetir esta validación y registrar quién hizo el cambio.

### 8.14 Reservas y pasajeros

Servicio: [`src/services/reservationService.ts`](./src/services/reservationService.ts).

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/reserva` | Listar reservas |
| `PUT` | `/reserva/:id/cancelar` | Cancelar reserva |
| `PUT` | `/reserva-detalle/:detalleId` | Editar pasajero |

Cancelación:

```json
{}
```

Actualización de pasajero:

```json
{
  "nombre_pasajero": "Lucía",
  "apellido_pasajero": "Hernández",
  "tipo_documento": "DPI",
  "numero_documento": "2456812340101"
}
```

Estados de reserva:

```text
PENDIENTE
CONFIRMADA
EXPIRADA
CANCELADA
```

Una cancelación debe liberar o marcar correctamente los asientos, conservar el
historial, actualizar boletos y aplicar la política de reembolso. No debe
eliminar físicamente la reserva si se necesita auditoría.

### 8.15 Pagos y métodos de pago

Servicio: [`src/services/paymentService.ts`](./src/services/paymentService.ts)
y [`src/services/paymentMethodService.ts`](./src/services/paymentMethodService.ts).

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/pago` | Listado paginado |
| `GET` | `/pago?page=1&limit=20&q=...&estado=...&periodo=...` | Filtros |
| `PATCH` | `/pago/:id/estado` | Aprobar/rechazar |
| `GET` | `/metodo-pago` | Catálogo |
| `PATCH` | `/metodo-pago/:id/toggle` | Activar/desactivar |

Actualización:

```json
{
  "estado": "APROBADO"
}
```

Estados de pago:

```text
PENDIENTE
APROBADO
RECHAZADO
```

La respuesta paginada debe contener `data`, `total`, `page`, `limit`,
`total_pages` y `resumen`. El monto debe ser numérico y no debe aceptarse una
aprobación sin verificar la reserva, moneda, monto y referencia.

### 8.16 Reasignaciones

Servicio: [`src/services/reasignacionService.ts`](./src/services/reasignacionService.ts).

Reasignación masiva:

```http
POST /reasignacion/masiva
```

```json
{
  "vuelo_cancelado_id": 10,
  "vuelos_destino_ids": [1, 2]
}
```

Reasignación individual:

```http
POST /reasignacion/individual
```

```json
{
  "detalle_reserva_id": 20481,
  "vuelos_ids": [11]
}
```

Validaciones del frontend:

- debe existir un vuelo cancelado;
- la reasignación masiva requiere al menos un vuelo destino;
- la capacidad total disponible debe cubrir a los pasajeros;
- la reasignación individual requiere un segmento por vuelo;
- los segmentos seleccionados no pueden repetirse.

El backend debe ejecutar la operación en transacción y conservar una relación
entre vuelo original, vuelo nuevo, reserva, pasajero, usuario, fecha y motivo.

### 8.17 Usuarios, roles, errores y logs

Servicio: [`src/services/securityService.ts`](./src/services/securityService.ts).

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/usuarios` | Lista de usuarios |
| `POST` | `/usuarios` | Crear usuario |
| `PATCH` | `/usuarios/:id/toggle` | Activar/desactivar |
| `GET` | `/roles` | Catálogo de roles |
| `GET` | `/errores` | Errores registrados |
| `GET` | `/logs` | Logs del servidor |

Crear usuario:

```json
{
  "nombre": "Ana",
  "apellido": "Quiñónez",
  "correo": "a.quinonez@example.com",
  "password": "ContraseñaInicialSegura",
  "rol_id": 3
}
```

Validar correo único, contraseña de acuerdo con la política de seguridad y
`rol_id` existente. Nunca almacenar contraseñas en texto plano.

---

## 9. Relaciones entre entidades

```text
aerolinea 1 ──────── N avion
aeropuerto 1 ─────── N terminal
terminal 1 ───────── N puerta_embarque
aeropuerto 1 ─────── N ruta (como origen)
aeropuerto 1 ─────── N ruta (como destino)
avion 1 ──────────── N asiento
tipo_asiento 1 ───── N asiento
ruta 1 ───────────── N vuelo
avion 1 ──────────── N vuelo
puerta_embarque 1 ── N vuelo
vuelo 1 ───────────── N vuelo_asiento
asiento 1 ─────────── N vuelo_asiento
cliente 1 ─────────── N reserva
reserva 1 ─────────── N reserva_detalle
reserva_detalle 1 ─── N boleto
reserva 1 ─────────── N pago
usuario 1 ─────────── N auditoria/log
```

La relación `vuelo_asiento` es la pieza central del inventario: une un vuelo
con un asiento físico de la aeronave y conserva el precio y estado comercial
para ese vuelo específico.

---

## 10. Flujo completo recomendado: crear un vuelo vendible

1. Autenticarse en `/login`.
2. Consultar aeropuertos, rutas, aeronaves y puertas.
3. Crear o activar los catálogos faltantes.
4. Verificar que la ruta esté activa.
5. Consultar `/avion/disponibles` con salida y llegada ISO.
6. Crear el vuelo con estado `PROGRAMADO`.
7. Ejecutar `/vuelo-asiento/init` para generar un registro por asiento.
8. Consultar `/vuelo-asiento?vueloId=:id`.
9. Asignar precios con `/vuelo-asiento/bulk-price`.
10. En ventas, reservar temporalmente un asiento.
11. Registrar o seleccionar cliente.
12. Ejecutar `/ventas/mostrador` o el flujo de reserva correspondiente.
13. Confirmar que se generaron pago, boleto y código de check-in.
14. En despacho, ejecutar `/checkin` con el código emitido.
15. Verificar el cambio en inventario y bitácora.

---

## 11. Reglas de transacción y concurrencia

Estas reglas deben implementarse en el backend, aunque el frontend también
deshabilite botones durante una solicitud:

- dos operadores no pueden vender el mismo `vuelo_asiento`;
- reservar temporalmente debe usar bloqueo o una condición atómica;
- la expiración de una reserva debe liberar el asiento una sola vez;
- una venta debe comprobar nuevamente el estado justo antes de confirmar;
- los cambios de estado deben validar la transición anterior;
- la generación masiva de cabina debe ser atómica;
- la reasignación debe reservar capacidad antes de liberar la reserva original;
- pagos y boletos deben quedar consistentes si un proveedor externo falla;
- todas las acciones sensibles deben guardar usuario, fecha, entidad, estado
  anterior, estado nuevo y descripción.

---

## 12. Respuestas y manejo de errores

`api.ts` interpreta una respuesta de error buscando, en este orden:

1. texto no vacío;
2. propiedad JSON `message`;
3. propiedad JSON `error`;
4. texto genérico basado en el código HTTP.

Formato recomendado de error:

```json
{
  "message": "El asiento ya no está disponible.",
  "code": "SEAT_NOT_AVAILABLE",
  "details": {
    "vuelo_asiento_id": 501
  }
}
```

Códigos mínimos esperados:

| Código | Significado |
|---:|---|
| `400` | Datos inválidos o regla de negocio incumplida |
| `401` | Token ausente, inválido o expirado |
| `403` | Sin permisos |
| `404` | Registro relacionado inexistente |
| `409` | Conflicto de unicidad o concurrencia |
| `422` | Validación semántica |
| `500` | Error inesperado del servidor |

El frontend muestra el mensaje del backend en varias operaciones. Los errores
deben ser claros para el operador y no deben incluir contraseñas, tokens ni
detalles internos de la base de datos en producción.

---

## 13. Datos mock y datos persistidos

Los archivos de datos locales sirven para tipos, demostración o compatibilidad
visual:

- `data1.ts`: aeropuertos, rutas, aeronaves, vuelos y helpers;
- `data2.ts`: terminales, puertas, reservas, usuarios, roles y errores;
- `data3.ts`: aerolíneas, tipos de asiento, pagos, reasignaciones y bitácora.

No usar estos arreglos como mecanismo de carga inicial de producción. Para
sembrar una base real se debe crear un script de migración/seed en el backend
que respete las relaciones y el orden de la sección 7.

---

## 14. Lista de comprobación para una carga inicial

### Seguridad

- [ ] Existe un administrador activo.
- [ ] El login devuelve `access_token` y `usuario`.
- [ ] Los roles están creados.
- [ ] Las contraseñas están hasheadas.

### Catálogos

- [ ] Aerolíneas con IATA/ICAO únicos.
- [ ] Aeropuertos con IATA/ICAO únicos.
- [ ] Tipos de asiento.
- [ ] Métodos de pago.

### Infraestructura y flota

- [ ] Terminales asociadas a aeropuertos válidos.
- [ ] Puertas asociadas a una sede/terminal válida.
- [ ] Rutas activas con origen y destino diferentes.
- [ ] Aeronaves con matrícula única y capacidad positiva.
- [ ] Cabinas cuyo conteo coincide con la capacidad.

### Vuelos

- [ ] Fechas en ISO y llegada posterior a salida.
- [ ] Aeronave disponible durante todo el intervalo.
- [ ] Puerta activa y compatible.
- [ ] Estado inicial `PROGRAMADO`.
- [ ] Inventario vuelo-asiento inicializado.
- [ ] Precios positivos asignados.

### Comercial

- [ ] Clientes con correo válido.
- [ ] Asientos temporales con expiración.
- [ ] Venta transaccional.
- [ ] Pago, boleto y check-in vinculados.
- [ ] Cancelaciones y reembolsos auditables.

### Operación

- [ ] Check-in solo para boletos confirmados.
- [ ] Cambios de estado con descripción.
- [ ] Reasignaciones con capacidad suficiente.
- [ ] Auditoría de acciones críticas.

---

## 15. Referencias de implementación

- Cliente HTTP y autenticación: [`src/services/api.ts`](./src/services/api.ts)
- Sesión y roles del frontend: [`src/lib/auth.ts`](./src/lib/auth.ts)
- Protección de rutas: [`src/routes/ProtectedRoute.tsx`](./src/routes/ProtectedRoute.tsx)
- Rutas de navegación: [`src/routes/AppRouter.tsx`](./src/routes/AppRouter.tsx)
- Servicios de infraestructura:
  [`src/services/airportService.ts`](./src/services/airportService.ts),
  [`src/services/routeService.ts`](./src/services/routeService.ts),
  [`src/services/terminalService.ts`](./src/services/terminalService.ts),
  [`src/services/gateService.ts`](./src/services/gateService.ts)
- Servicios de flota:
  [`src/services/airlineService.ts`](./src/services/airlineService.ts),
  [`src/services/planeService.ts`](./src/services/planeService.ts),
  [`src/services/seatTypeService.ts`](./src/services/seatTypeService.ts),
  [`src/services/seatService.ts`](./src/services/seatService.ts)
- Servicios de operación:
  [`src/services/flightService.ts`](./src/services/flightService.ts),
  [`src/services/vueloAsientoService.ts`](./src/services/vueloAsientoService.ts),
  [`src/services/despachoService.ts`](./src/services/despachoService.ts),
  [`src/services/reasignacionService.ts`](./src/services/reasignacionService.ts)
- Servicios comerciales:
  [`src/services/reservationService.ts`](./src/services/reservationService.ts),
  [`src/services/paymentService.ts`](./src/services/paymentService.ts),
  [`src/services/paymentMethodService.ts`](./src/services/paymentMethodService.ts)
- Servicios de seguridad:
  [`src/services/securityService.ts`](./src/services/securityService.ts)

---

## 16. Pendientes para cerrar la documentación de base de datos

Para que esta documentación pueda considerarse también un diccionario físico de
la base de datos, falta incorporar desde el backend:

1. motor y versión de base de datos;
2. nombre exacto de cada tabla;
3. columnas, tipos, `NULL/NOT NULL` y valores por defecto;
4. claves primarias y foráneas;
5. índices y restricciones `UNIQUE`;
6. `CHECK constraints`;
7. política de borrado (`CASCADE`, `RESTRICT`, baja lógica);
8. definición de moneda y unidad de distancia;
9. tiempos de expiración de reservas temporales;
10. catálogo completo de transiciones de estados;
11. formato de paginación y errores;
12. roles autorizados por endpoint;
13. estrategia de auditoría y retención de logs;
14. contratos de webhooks o pasarela de pago, si existen.

Mientras esos datos no estén disponibles, este archivo debe tratarse como la
especificación de integración del frontend y como guía de carga funcional, no
como sustituto de las migraciones o del esquema real del backend.
