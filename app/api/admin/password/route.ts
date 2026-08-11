import { proxy, forwardAuth } from "@/lib/proxy";

export function PATCH(request: Request) {
  return request
    .json()
    .catch(() => null)
    .then((body) =>
      proxy("/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...forwardAuth(request) },
        body: JSON.stringify(body),
      }),
    );
}
