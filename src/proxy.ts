import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, "60 s"),
});

// Polled every couple of seconds while a generation runs. It only reads job state,
// and the limit exists to protect the LLM budget, so it must not use up the allowance.
const JOB_STATUS = /^\/api\/generate-tests\/[^/]+$/;

export default async function proxy(req: NextRequest) {
  if (req.method === "GET" && JOB_STATUS.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}

// /api/health is excluded so platform health checks never depend on Redis.
export const config = { matcher: "/api/((?!health).*)" };
