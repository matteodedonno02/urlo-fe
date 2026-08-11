import { proxy, forwardAuth } from "@/lib/proxy";

export function GET(request: Request) {
  return proxy("/users", { headers: forwardAuth(request) });
}
