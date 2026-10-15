export type Estado = "PROGRAMADO" | "ABORDANDO" | "EN_VUELO" | "FINALIZADO" | "CANCELADO";

export interface Airport {
  id: number;
  nombre: string;
  iata: string;
  icao: string;
  ciudad: string;
  pais: string;
  direccion: string;
  activo: boolean;
}

export const airports: Airport[] = [
  { id: 1, nombre: "Aeropuerto Internacional La Aurora", iata: "GUA", icao: "MGGT", ciudad: "Ciudad de Guatemala", pais: "Guatemala", direccion: "Av. Hincapié, Zona 13", activo: true },
  { id: 2, nombre: "Aeropuerto Internacional de Tocumen", iata: "PTY", icao: "MPTO", ciudad: "Ciudad de Panamá", pais: "Panamá", direccion: "Vía Tocumen", activo: true },
  { id: 3, nombre: "Aeropuerto Internacional El Dorado", iata: "BOG", icao: "SKBO", ciudad: "Bogotá", pais: "Colombia", direccion: "Av. El Dorado 103-09", activo: true },
  { id: 4, nombre: "Aeropuerto Internacional Benito Juárez", iata: "MEX", icao: "MMMX", ciudad: "Ciudad de México", pais: "México", direccion: "Av. Capitán Carlos León", activo: true },
  { id: 5, nombre: "Aeropuerto Internacional de Miami", iata: "MIA", icao: "KMIA", ciudad: "Miami", pais: "Estados Unidos", direccion: "2100 NW 42nd Ave", activo: true },
  { id: 6, nombre: "Aeropuerto Internacional Juan Santamaría", iata: "SJO", icao: "MROC", ciudad: "San José", pais: "Costa Rica", direccion: "Alajuela", activo: true },
  { id: 7, nombre: "Aeropuerto Internacional Jorge Chávez", iata: "LIM", icao: "SPJC", ciudad: "Lima", pais: "Perú", direccion: "Av. Elmer Faucett", activo: false },
  { id: 8, nombre: "Aeropuerto Internacional Ilopango", iata: "SAL", icao: "MSLP", ciudad: "San Salvador", pais: "El Salvador", direccion: "Km 47 Carretera Comalapa", activo: true },
];

export interface Route {
  id: number;
  origen: number;
  destino: number;
  duracion: number;
  distancia: number;
  activa: boolean;
}

export const routes: Route[] = [
  { id: 1, origen: 1, destino: 2, duracion: 110, distancia: 1190, activa: true },
  { id: 2, origen: 1, destino: 5, duracion: 190, distancia: 1790, activa: true },
  { id: 3, origen: 2, destino: 3, duracion: 105, distancia: 780, activa: true },
  { id: 4, origen: 4, destino: 1, duracion: 125, distancia: 1060, activa: true },
  { id: 5, origen: 5, destino: 2, duracion: 200, distancia: 1850, activa: true },
  { id: 6, origen: 6, destino: 3, duracion: 140, distancia: 1280, activa: true },
  { id: 7, origen: 3, destino: 4, duracion: 245, distancia: 3160, activa: true },
  { id: 8, origen: 8, destino: 5, duracion: 195, distancia: 1850, activa: true },
];

export interface Plane {
  id: number;
  aerolinea: number;
  activo: boolean;
  matricula: string;
  modelo: string;
  capacidad: number;
  estado: "Operativa" | "Mantenimiento";
}

export const planes: Plane[] = [
  { id: 1, aerolinea: 1, activo: true, matricula: "N-AX101", modelo: "Airbus A320neo", capacidad: 180, estado: "Operativa" },
  { id: 2, aerolinea: 1, activo: true, matricula: "N-AX102", modelo: "Airbus A320neo", capacidad: 180, estado: "Operativa" },
  { id: 3, aerolinea: 1, activo: true, matricula: "N-AX205", modelo: "Airbus A321", capacidad: 220, estado: "Operativa" },
  { id: 4, aerolinea: 1, activo: true, matricula: "N-AX310", modelo: "Boeing 737-800", capacidad: 162, estado: "Mantenimiento" },
  { id: 5, aerolinea: 1, activo: true, matricula: "N-AX311", modelo: "Boeing 737 MAX 8", capacidad: 178, estado: "Operativa" },
  { id: 6, aerolinea: 2, activo: true, matricula: "N-AX420", modelo: "Embraer E190", capacidad: 100, estado: "Operativa" },
  { id: 7, aerolinea: 1, activo: true, matricula: "N-AX501", modelo: "Boeing 787-9", capacidad: 296, estado: "Operativa" },
  { id: 8, aerolinea: 2, activo: true, matricula: "N-AX421", modelo: "Embraer E195-E2", capacidad: 132, estado: "Mantenimiento" },
];

export const gates = ["A1", "A2", "A4", "A7", "B3", "B5", "B9", "C2", "C6", "D1"];

export interface Flight {
  id: number;
  numero: string;
  ruta: number;
  avion: number;
  salida: string;
  llegada: string;
  puerta: string | null;
  estado: Estado;
}

export const flights: Flight[] = [
  { id: 1, numero: "AX 204", ruta: 1, avion: 1, salida: "2026-10-15T14:20", llegada: "2026-10-15T16:10", puerta: "A4", estado: "ABORDANDO" },
  { id: 2, numero: "AX 311", ruta: 2, avion: 3, salida: "2026-10-15T13:05", llegada: "2026-10-15T16:15", puerta: "B3", estado: "EN_VUELO" },
  { id: 3, numero: "AX 118", ruta: 3, avion: 5, salida: "2026-10-15T15:45", llegada: "2026-10-15T17:30", puerta: "C2", estado: "PROGRAMADO" },
  { id: 4, numero: "AX 072", ruta: 4, avion: 2, salida: "2026-10-15T16:30", llegada: "2026-10-15T18:35", puerta: "A7", estado: "PROGRAMADO" },
  { id: 5, numero: "AX 540", ruta: 5, avion: 7, salida: "2026-10-15T12:10", llegada: "2026-10-15T15:30", puerta: "B9", estado: "EN_VUELO" },
  { id: 6, numero: "AX 623", ruta: 6, avion: 6, salida: "2026-10-15T17:15", llegada: "2026-10-15T19:35", puerta: null, estado: "PROGRAMADO" },
  { id: 7, numero: "AX 090", ruta: 7, avion: 5, salida: "2026-10-15T18:40", llegada: "2026-10-15T22:45", puerta: "D1", estado: "PROGRAMADO" },
  { id: 8, numero: "AX 415", ruta: 8, avion: 3, salida: "2026-10-14T09:00", llegada: "2026-10-14T12:15", puerta: "B5", estado: "FINALIZADO" },
  { id: 9, numero: "AX 266", ruta: 1, avion: 2, salida: "2026-10-16T07:10", llegada: "2026-10-16T09:00", puerta: "A2", estado: "PROGRAMADO" },
  { id: 10, numero: "AX 331", ruta: 2, avion: 1, salida: "2026-10-14T21:30", llegada: "2026-10-15T00:40", puerta: "A1", estado: "CANCELADO" },
  { id: 11, numero: "AX 128", ruta: 3, avion: 6, salida: "2026-10-16T10:25", llegada: "2026-10-16T12:10", puerta: "C6", estado: "PROGRAMADO" },
  { id: 12, numero: "AX 705", ruta: 4, avion: 7, salida: "2026-10-14T06:15", llegada: "2026-10-14T08:20", puerta: "B3", estado: "FINALIZADO" },
];

export const airportById = (id: number) => airports.find((a) => a.id === id)!;
export const routeLabel = (id: number) => {
  const r = routes.find((x) => x.id === id)!;
  return `${airportById(r.origen).iata} → ${airportById(r.destino).iata}`;
};
export const planeById = (id: number) => planes.find((p) => p.id === id)!;

export const fmtDuration = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", { day: "2-digit", month: "short" }).replace(".", "");
export const fmtTime = (iso: string) => iso.slice(11, 16);
