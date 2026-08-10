import { apiBase } from "@/lib/urls";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/s/[code]">,
) {
  const { code } = await ctx.params;
  try {
    const res = await fetch(`${apiBase()}/short-urls/${code}`, {
      redirect: "manual",
    });
    if (res.status === 301 || res.status === 302) {
      const location = res.headers.get("location");
      if (location) return new Response(null, { status: 302, headers: { location } });
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.originalUrl) {
        return new Response(null, { status: 302, headers: { location: data.originalUrl } });
      }
    }
  } catch {
    // fall through to not found
  }
  return Response.json({ error: "Short link not found" }, { status: 404 });
}
