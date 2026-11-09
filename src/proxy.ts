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
  const { pathname } = req.nextUrl;

  if (req.method === "GET" && JOB_STATUS.test(pathname)) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // Sign in attempts get their own allowance, so guessing passwords cannot use up the
  // generation budget, and a busy workspace cannot lock someone out of signing in.
  const bucket = pathname.startsWith("/api/auth/") ? `auth:${ip}` : ip;
  const { success } = await ratelimit.limit(bucket);

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}

// /api/health is excluded so platform health checks never depend on Redis.
export const config = { matcher: "/api/((?!health).*)" };
