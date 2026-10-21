const TOKEN_STORAGE_KEY = "nexairline_token";
const USER_STORAGE_KEY = "nexairline_user";

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
