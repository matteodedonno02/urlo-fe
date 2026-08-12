import { config } from "@/lib/config";
import { authFetch } from "@/lib/auth";

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

export type MyShortUrlsPage = {
  items: ShortUrl[];
  nextCursor: string | null;
};

export function apiBase(): string {
  return config.apiBaseUrl;
}

export function shortUrlFor(code: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/s/${code}`;
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? fallback;
}

export async function createShortUrl(originalUrl: string): Promise<ShortUrl> {
  const res = await authFetch("/api/urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalUrl }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not shorten this link."));
  }
  return (await res.json()) as ShortUrl;
}

export async function listShortUrls(): Promise<ShortUrl[]> {
  const page = await listMyShortUrls({ limit: 20 });
  return page.items;
}

export async function listMyShortUrls(params?: {
  limit?: number;
  cursor?: string;
  q?: string;
}): Promise<MyShortUrlsPage> {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  const res = await authFetch(`/api/urls/my${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not load your links."));
  }
  return (await res.json()) as MyShortUrlsPage;
}

export async function updateShortUrlOriginalUrl(
  id: string,
  originalUrl: string,
): Promise<ShortUrl> {
  const res = await authFetch(`/api/urls/${id}/original-url`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalUrl }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Could not update this link."));
  }
  return (await res.json()) as ShortUrl;
}
