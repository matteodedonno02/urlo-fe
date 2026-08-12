import { proxy, forwardAuth } from "@/lib/proxy";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxy(`/short-urls/my${search}`, { headers: forwardAuth(request) });
}
