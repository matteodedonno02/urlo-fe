import { proxy, forwardAuth } from "@/lib/proxy";

export function GET(request: Request) {
  return proxy("/short-urls/my", {
    headers: forwardAuth(request),
  });
}

export function POST(request: Request) {
  return request
    .json()
    .catch(() => null)
    .then((body) =>
      proxy("/short-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...forwardAuth(request) },
        body: JSON.stringify(body),
      }),
    );
}
