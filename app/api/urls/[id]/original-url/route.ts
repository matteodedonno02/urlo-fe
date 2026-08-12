import { proxy, forwardAuth } from "@/lib/proxy";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/urls/[id]/original-url">,
) {
  const { id } = await ctx.params;
  return request
    .json()
    .catch(() => null)
    .then((body) =>
      proxy(`/short-urls/${id}/original-url`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...forwardAuth(request) },
        body: JSON.stringify(body),
      }),
    );
}
