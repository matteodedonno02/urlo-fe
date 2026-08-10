import { apiBase } from "@/lib/urls";

async function proxy(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${apiBase()}${path}`, init);
    const data = await res.json().catch(() => null);
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "backend unreachable" }, { status: 503 });
  }
}

export function GET() {
  return proxy("/short-urls");
}

export function POST(request: Request) {
  return request
    .json()
    .catch(() => null)
    .then((body) =>
      proxy("/short-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
}
