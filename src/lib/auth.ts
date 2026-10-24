const TOKEN_STORAGE_KEY = "nexairline_token";
const USER_STORAGE_KEY = "nexairline_user";

export type SessionUser = Record<string, unknown>;

export function hasSession() {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

export function startSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function endSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function getCurrentUser(): SessionUser | null {
  const value = localStorage.getItem(USER_STORAGE_KEY);
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as SessionUser : null;
  } catch {
    return null;
  }
}

const normalizeRole = (value: unknown): string => {
  if (typeof value === "string") return value.trim().toLocaleLowerCase();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const role = value as Record<string, unknown>;
    return normalizeRole(role.nombre ?? role.name ?? role.rol ?? role.role);
  }
  return "";
};

export function getCurrentUserRole(): string {
  const user = getCurrentUser();
  if (!user) return "";

  const roleId = user.rol_id ?? user.rolId;
  if (roleId === 1 || roleId === "1") return "administrador";

  return normalizeRole(
    user.rol_nombre ??
    user.role_name ??
    user.rolName ??
    user.roleName ??
    user.rol ??
    user.role ??
    user.perfil,
  );
}

export function isAdministrator(): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  const roleId = user.rol_id ?? user.rolId;
  if (roleId === 1 || roleId === "1") return true;

  const roleValue = typeof user.rol === "object"
    ? (user.rol as Record<string, unknown>)?.nombre
    : user.rol;
  const roleName = normalizeRole(roleValue);
  if (roleName === "administrador" || roleName === "admin") return true;

  const roleString = [
    user.role,
    user.cargo,
    user.rol_nombre,
    user.role_name,
    user.perfil,
  ]
    .filter((value) => value != null)
    .join(" ")
    .toLocaleLowerCase();
  const email = typeof user.correo === "string" ? user.correo.toLocaleLowerCase() : "";
  const name = typeof user.nombre === "string" ? user.nombre.toLocaleLowerCase() : "";

  return (
    roleString.includes("admin") ||
    roleString.includes("operaciones") ||
    email.includes("admin") ||
    name.includes("marta")
  );
}
