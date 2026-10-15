export interface Terminal { id: number; aeropuerto: number; nombre: string; descripcion: string; activo: boolean }
export const terminals: Terminal[] = [
  { id: 1, aeropuerto: 1, nombre: "Terminal Norte", descripcion: "Vuelos regionales y centroamericanos", activo: true },
  { id: 2, aeropuerto: 1, nombre: "Terminal Sur", descripcion: "Vuelos internacionales de largo alcance", activo: true },
  { id: 3, aeropuerto: 2, nombre: "Terminal 1", descripcion: "Hub de conexiones", activo: true },
  { id: 4, aeropuerto: 2, nombre: "Terminal 2", descripcion: "Operaciones de carga y chárter", activo: false },
  { id: 5, aeropuerto: 3, nombre: "El Dorado I", descripcion: "Salidas nacionales e internacionales", activo: true },
  { id: 6, aeropuerto: 4, nombre: "Terminal 1 MEX", descripcion: "Operaciones principales", activo: true },
  { id: 7, aeropuerto: 5, nombre: "Concourse D", descripcion: "Vuelos a Latinoamérica", activo: true },
];

export interface GateRow { id: number; terminal: number; numero: string; descripcion: string; activo: boolean }
export const gateRows: GateRow[] = [
  { id: 1, terminal: 1, numero: "A1", descripcion: "Pasarela directa", activo: true },
  { id: 2, terminal: 1, numero: "A2", descripcion: "Pasarela directa", activo: true },
  { id: 3, terminal: 1, numero: "A4", descripcion: "Embarque remoto con bus", activo: true },
  { id: 4, terminal: 1, numero: "A7", descripcion: "Pasarela directa", activo: true },
  { id: 5, terminal: 2, numero: "B3", descripcion: "Fuselaje ancho", activo: true },
  { id: 6, terminal: 2, numero: "B5", descripcion: "Fuselaje ancho", activo: false },
  { id: 7, terminal: 2, numero: "B9", descripcion: "Fuselaje ancho · A380 compatible", activo: true },
  { id: 8, terminal: 3, numero: "C2", descripcion: "Conexiones rápidas", activo: true },
  { id: 9, terminal: 3, numero: "C6", descripcion: "Conexiones rápidas", activo: true },
  { id: 10, terminal: 5, numero: "D1", descripcion: "Pasarela directa", activo: true },
];

export type ReservaEstado = "PENDIENTE" | "CONFIRMADA" | "EXPIRADA" | "CANCELADA";
export interface Pax {
  nombre: string; doc: string; vuelo: string; asiento: string; precio: number;
  boleto: string; checkin: string; estadoBoleto: "EMITIDO" | "CANCELADO"; checkedIn: boolean;
}
export interface Reserva {
  id: number; cliente: string; correo: string; itinerario: number; estado: ReservaEstado;
  creada: string; expira: string | null; pago: "APROBADO" | "PENDIENTE" | "RECHAZADO" | null; metodo: string | null; pax: Pax[];
}

const p = (nombre: string, doc: string, vuelo: string, asiento: string, precio: number, boleto: string, checkin: string, estadoBoleto: Pax["estadoBoleto"] = "EMITIDO", checkedIn = false): Pax =>
  ({ nombre, doc, vuelo, asiento, precio, boleto, checkin, estadoBoleto, checkedIn });

export const reservas: Reserva[] = [
  { id: 20481, cliente: "Lucía Hernández", correo: "lucia.hernandez@mail.com", itinerario: 9120, estado: "CONFIRMADA", creada: "2026-10-15T08:12", expira: null, pago: "APROBADO", metodo: "Tarjeta de crédito",
    pax: [p("Lucía Hernández", "DPI 2456 81234 0101", "AX 204", "12A", 185, "057-2400481", "K7M2QD", "EMITIDO", true), p("Mateo Hernández", "DPI 2456 99871 0101", "AX 204", "12B", 185, "057-2400482", "R4T9LB")] },
  { id: 20480, cliente: "Andrés Villatoro", correo: "avillatoro@corpmail.gt", itinerario: 9119, estado: "PENDIENTE", creada: "2026-10-15T09:40", expira: "2026-10-15T10:10", pago: "PENDIENTE", metodo: "Transferencia",
    pax: [p("Andrés Villatoro", "Pasaporte G4482910", "AX 311", "3C", 420, "—", "—")] },
  { id: 20479, cliente: "Camila Ortega", correo: "camila.ortega@mail.com", itinerario: 9118, estado: "CONFIRMADA", creada: "2026-10-14T21:05", expira: null, pago: "APROBADO", metodo: "Tarjeta de débito",
    pax: [p("Camila Ortega", "Pasaporte AB129044", "AX 118", "21F", 140, "057-2400470", "H2W8NC"), p("Sofía Ortega", "Pasaporte AB129045", "AX 118", "21E", 140, "057-2400471", "J9P3VX"), p("Daniel Ortega", "Pasaporte AB129046", "AX 118", "21D", 140, "057-2400472", "Z5Q1MF", "CANCELADO")] },
  { id: 20478, cliente: "Jorge Mendizábal", correo: "jmendizabal@mail.com", itinerario: 9117, estado: "EXPIRADA", creada: "2026-10-14T18:30", expira: "2026-10-14T19:00", pago: "RECHAZADO", metodo: "Tarjeta de crédito",
    pax: [p("Jorge Mendizábal", "DPI 1998 33120 0301", "AX 072", "8D", 165, "—", "—")] },
  { id: 20477, cliente: "Paola Castillo", correo: "paola.castillo@mail.com", itinerario: 9116, estado: "CONFIRMADA", creada: "2026-10-14T15:22", expira: null, pago: "APROBADO", metodo: "PayPal",
    pax: [p("Paola Castillo", "Pasaporte PA882910", "AX 540", "2A", 540, "057-2400455", "B6L4TS", "EMITIDO", true)] },
  { id: 20476, cliente: "Ricardo Samayoa", correo: "rsamayoa@mail.com", itinerario: 9115, estado: "CANCELADA", creada: "2026-10-13T12:00", expira: null, pago: "APROBADO", metodo: "Tarjeta de crédito",
    pax: [p("Ricardo Samayoa", "DPI 2231 55102 0101", "AX 331", "15C", 190, "057-2400431", "N8D2KA", "CANCELADO"), p("Elena Samayoa", "DPI 2231 55103 0101", "AX 331", "15B", 190, "057-2400432", "T3C7YW", "CANCELADO")] },
  { id: 20475, cliente: "Valeria Ruiz", correo: "valeria.ruiz@mail.com", itinerario: 9114, estado: "PENDIENTE", creada: "2026-10-15T11:58", expira: "2026-10-15T12:28", pago: null, metodo: null,
    pax: [p("Valeria Ruiz", "Pasaporte MX440218", "AX 623", "6A", 175, "—", "—"), p("Héctor Ruiz", "Pasaporte MX440219", "AX 623", "6B", 175, "—", "—")] },
];

export interface Usuario { id: number; nombre: string; correo: string; rol: number; activo: boolean; creado: string }
export const roles = [
  { id: 1, nombre: "Administrador", descripcion: "Acceso total al sistema" },
  { id: 2, nombre: "Operaciones", descripcion: "Vuelos, puertas y asientos" },
  { id: 3, nombre: "Ventas", descripcion: "Reservas, pagos y clientes" },
  { id: 4, nombre: "Auditor", descripcion: "Solo lectura y bitácoras" },
];
export const usuarios: Usuario[] = [
  { id: 1, nombre: "Marta Ramírez", correo: "m.ramirez@airlnex.com", rol: 1, activo: true, creado: "2024-02-11" },
  { id: 2, nombre: "Luis Barrios", correo: "l.barrios@airlnex.com", rol: 2, activo: true, creado: "2024-05-03" },
  { id: 3, nombre: "Ana Quiñónez", correo: "a.quinonez@airlnex.com", rol: 3, activo: true, creado: "2025-01-20" },
  { id: 4, nombre: "Pedro Gálvez", correo: "p.galvez@airlnex.com", rol: 2, activo: false, creado: "2025-03-14" },
  { id: 5, nombre: "Sara Monzón", correo: "s.monzon@airlnex.com", rol: 4, activo: true, creado: "2025-08-02" },
  { id: 6, nombre: "Diego Fuentes", correo: "d.fuentes@airlnex.com", rol: 3, activo: true, creado: "2026-01-09" },
];

export interface ErrLog { id: number; tipo: string; mensaje: string; detalle: string; path: string; fecha: string }
export const errores: ErrLog[] = [
  { id: 9041, tipo: "DatabaseError", mensaje: "deadlock detected on Vuelo_asiento", detalle: "Process 4412 waits for ShareLock on transaction 88120; blocked by process 4398.", path: "POST /api/vuelo-asiento/bloqueo", fecha: "2026-10-15 13:38:12" },
  { id: 9040, tipo: "ValidationError", mensaje: "fecha_llegada must be after fecha_salida", detalle: "CHECK constraint \"Vuelo_check\" violated by row (AX 812).", path: "POST /api/vuelos", fecha: "2026-10-15 13:21:47" },
  { id: 9039, tipo: "AuthError", mensaje: "JWT expired", detalle: "Token issued at 2026-10-15T05:02:11Z, expired at 13:02:11Z. usuario_id=4", path: "GET /api/reservas", fecha: "2026-10-15 13:04:03" },
  { id: 9038, tipo: "TimeoutError", mensaje: "Payment gateway did not respond", detalle: "Upstream timeout after 15000ms. reserva_id=20480 metodo_pago_id=3", path: "POST /api/pagos", fecha: "2026-10-15 11:52:30" },
  { id: 9037, tipo: "DatabaseError", mensaje: "duplicate key violates unique constraint", detalle: "Key (numero_boleto)=(057-2400455) already exists.", path: "POST /api/boletos", fecha: "2026-10-15 10:17:58" },
  { id: 9036, tipo: "ValidationError", mensaje: "aeropuerto_origen_id <> aeropuerto_destino_id", detalle: "Ruta con origen y destino idénticos rechazada.", path: "POST /api/rutas", fecha: "2026-10-14 22:40:09" },
];

export const subtotalOf = (r: Reserva) => r.pax.reduce((a, x) => a + x.precio, 0);
export const taxOf = (r: Reserva) => Math.round(subtotalOf(r) * 12) / 100;
export const totalOf = (r: Reserva) => subtotalOf(r) + taxOf(r);
