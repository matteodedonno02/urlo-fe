export type AuthUser = {
  id: string;
  email: string;
  role: "standard" | "admin";
};

const TOKEN_KEY = "urlo_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? fallback;
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

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Invalid email or password."));
  }
  const data = await res.json();
  setToken(data.access_token);
}

export async function fetchProfile(): Promise<AuthUser> {
  const res = await fetch("/api/auth/profile", { headers: authHeaders() });
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

export function logout(): void {
  clearToken();
}
