export type AuthUser = {
  id: string;
  email: string;
  role: "standard" | "admin";
};

const TOKEN_KEY = "urlo_token";
const REFRESH_TOKEN_KEY = "urlo_refresh_token";
const MUST_CHANGE_KEY = "urlo_must_change_password";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getMustChangePassword(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUST_CHANGE_KEY) === "1";
}

export function clearMustChangePassword(): void {
  window.localStorage.removeItem(MUST_CHANGE_KEY);
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? fallback;
}

let refreshInFlight: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) {
          clearTokens();
          return false;
        }
        const data = await res.json();
        setTokens(data.access_token, data.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401 || !(await refreshSession())) return res;

  const fresh = getToken();
  if (fresh) headers.set("Authorization", `Bearer ${fresh}`);
  return fetch(input, { ...init, headers });
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not create account."));
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ mustChangePassword: boolean }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Invalid email or password."));
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  if (data.mustChangePassword) {
    window.localStorage.setItem(MUST_CHANGE_KEY, "1");
  } else {
    window.localStorage.removeItem(MUST_CHANGE_KEY);
  }
  return { mustChangePassword: Boolean(data.mustChangePassword) };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await authFetch("/api/admin/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not update password."));
  }
  const data = await res.json();
  if (data.access_token && data.refresh_token) {
    setTokens(data.access_token, data.refresh_token);
  }
  clearMustChangePassword();
}

export async function fetchProfile(): Promise<AuthUser> {
  const res = await authFetch("/api/auth/profile");
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Session expired."));
  }
  const data = await res.json();
  return {
    id: data.sub,
    email: data.email,
    role: data.role === "admin" ? "admin" : "standard",
  };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  clearTokens();
  clearMustChangePassword();
  if (!refreshToken) return;
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Best-effort revoke: the local session is already cleared.
  }
}
