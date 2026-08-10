import { proxy, forwardAuth } from "@/lib/proxy";

export function GET(request: Request) {
  return proxy("/auth/profile", { headers: forwardAuth(request) });
}
