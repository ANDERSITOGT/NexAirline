const RAW_API_URL = import.meta.env.VITE_API_URL || "https://fly.astracode.org/api";
const API_PREFIX = RAW_API_URL.trim().replace(/\/$/, "");
const TOKEN_STORAGE_KEY = "nexairline_token";

export const isApiConfigured = Boolean(API_PREFIX);

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const withApiPrefix = (endpoint: string) => {
  if (!API_PREFIX) {
    throw new Error("VITE_API_URL is not configured");
  }
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return path === API_PREFIX || path.startsWith(`${API_PREFIX}/`) ? path : `${API_PREFIX}${path}`;
};

export async function checkApiConnection(): Promise<boolean> {
  if (!isApiConfigured || !API_PREFIX) return false;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(withApiPrefix("/vuelo"), {
      credentials: "same-origin",
      signal: controller.signal,
    });
    return response.status < 500;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

const errorMessage = (payload: unknown, status: number, statusText: string) => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
  }
  return statusText || `HTTP request failed with status ${status}`;
};

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(withApiPrefix(endpoint), { ...options, headers, credentials: "same-origin" });
  const text = await response.text();
  let payload: unknown;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.location.assign("/login");
  }
  if (!response.ok) throw new ApiError(response.status, errorMessage(payload, response.status, response.statusText), payload);
  if (response.status === 204 || !text) return null as T;

  if (typeof payload === "undefined") throw new ApiError(response.status, "The server returned an invalid JSON response");
  return payload as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
  put: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
