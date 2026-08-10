import { proxy } from "@/lib/proxy";

export function POST(request: Request) {
  return request
    .json()
    .catch(() => null)
    .then((body) =>
      proxy("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
}
