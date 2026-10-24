import { api } from "./api";

export interface SecurityRole {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface SecurityUser {
  id: number;
  nombre: string;
  apellido?: string | null;
  correo: string;
  rol: number | SecurityRole | string;
  activo: boolean;
  creado: string;
}

export interface SecurityError {
  id: number;
  tipo: string;
  mensaje: string;
  detalle: string;
  path: string;
  fecha: string;
}

export interface CreateSecurityUser {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  rol_id: number;
}

const list = <T>(value: T[] | { data?: T[]; results?: T[] } | null): T[] => {
  if (Array.isArray(value)) return value;
  return value?.data ?? value?.results ?? [];
};

export async function getSecurityUsers(): Promise<SecurityUser[]> {
  return list(await api.get<SecurityUser[] | { data?: SecurityUser[]; results?: SecurityUser[] }>("/usuarios"));
}

export async function getSecurityRoles(): Promise<SecurityRole[]> {
  return list(await api.get<SecurityRole[] | { data?: SecurityRole[]; results?: SecurityRole[] }>("/roles"));
}

export async function toggleSecurityUser(id: number): Promise<SecurityUser | void> {
  return api.patch<SecurityUser | void>(`/usuarios/${id}/toggle`);
}

export async function createSecurityUser(data: CreateSecurityUser): Promise<SecurityUser> {
  return api.post<SecurityUser>("/usuarios", data);
}

export async function getSecurityErrors(): Promise<SecurityError[]> {
  return list(await api.get<SecurityError[] | { data?: SecurityError[]; results?: SecurityError[] }>("/errores"));
}

export async function getServerLogs(): Promise<string[]> {
  const response = await api.get<string[] | { logs?: string[] }>("/logs");
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.logs)) return response.logs;
  return [];
}
