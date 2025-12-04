import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function getCache(key: string) {
  const cached = await redis.get<string>(key);
  if (!cached) return null;

  return new NextResponse(JSON.stringify(cached), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "X-Cache": "HIT",
    },
  });
}

export async function setCache(key: string, data: unknown, ttl = 60) {
  await redis.set(key, JSON.stringify(data), { ex: ttl });
}
