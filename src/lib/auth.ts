const SESSION_COOKIE = "nexairline_session";
const USER_STORAGE_KEY = "nexairline_user";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function hasSession() {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
}

export function startSession(user: unknown) {
  // The cookie is deliberately only a session marker. Never store credentials
  // or the complete user object in a client-readable cookie.
  document.cookie = `${SESSION_COOKIE}=active; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function endSession() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  localStorage.removeItem(USER_STORAGE_KEY);
}
