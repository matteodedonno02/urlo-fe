import { apiBase } from "@/lib/urls";

export async function proxy(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${apiBase()}${path}`, init);
    const data = await res.json().catch(() => null);
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "backend unreachable" }, { status: 503 });
  }
}

export function forwardAuth(req: Request): Record<string, string> {
  const auth = req.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}
