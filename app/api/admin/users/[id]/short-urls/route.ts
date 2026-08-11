import { proxy, forwardAuth } from "@/lib/proxy";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/admin/users/[id]/short-urls">,
) {
  const { id } = await ctx.params;
  return proxy(`/users/${id}/short-urls`, { headers: forwardAuth(request) });
}
