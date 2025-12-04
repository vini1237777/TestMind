import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "60 s"),
});

export const config = { matcher: "/api/:path*" };

export default async function proxy(req: NextRequest) {
  const ip =
    req.ip ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}
