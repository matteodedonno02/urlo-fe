import { config } from "@/lib/config";
import { authHeaders } from "@/lib/auth";

export type ShortUrl = {
  id: string;
  userId: string;
  shortCode: string;
  originalUrl: string;
  visitCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function apiBase(): string {
  return config.apiBaseUrl;
}

export function shortUrlFor(code: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/s/${code}`;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? fallback;
}

export async function createShortUrl(originalUrl: string): Promise<ShortUrl> {
  const res = await fetch("/api/urls", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ originalUrl }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not shorten this link."));
  }
  return (await res.json()) as ShortUrl;
}

export async function listShortUrls(): Promise<ShortUrl[]> {
  const res = await fetch("/api/urls", { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not load links."));
  }
  return (await res.json()) as ShortUrl[];
}
