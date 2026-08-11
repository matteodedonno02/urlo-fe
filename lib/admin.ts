import { authHeaders } from "@/lib/auth";

export type AdminUser = {
  id: string;
  email: string;
  role: "standard" | "admin";
  createdAt: string;
  updatedAt: string;
};

export type AdminShortUrl = {
  id: string;
  userId: string;
  shortCode: string;
  originalUrl: string;
  visitCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? fallback;
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users", { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not load users."));
  }
  return (await res.json()) as AdminUser[];
}

export async function getUser(id: string): Promise<AdminUser> {
  const res = await fetch(`/api/admin/users/${id}`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not load this user."));
  }
  return (await res.json()) as AdminUser;
}

export async function listUserShortUrls(id: string): Promise<AdminShortUrl[]> {
  const res = await fetch(`/api/admin/users/${id}/short-urls`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not load this user's links."));
  }
  return (await res.json()) as AdminShortUrl[];
}
