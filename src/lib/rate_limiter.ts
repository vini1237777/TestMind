// lib/rateLimiter.ts
import Redis from "ioredis";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis();

const LIMIT = 5;
const DURATION = 60;

export async function checkRateLimit(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const key = `rate-limit:${ip}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, DURATION);
  }

  if (current > LIMIT) {
    return NextResponse.json("Too many requests", { status: 429 });
  }

  return null;
}
