import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export function hashBody(body: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

export async function getPostCache(body: unknown) {
  const key = hashBody(body);
  const cached = await redis.get<string>(key);
  if (!cached) return null;

  return new NextResponse(cached, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "X-Cache": "HIT",
    },
  });
}

export async function setPostCache(body: unknown, data: unknown, ttl = 60) {
  const key = hashBody(body);
  await redis.set(key, JSON.stringify(data), { ex: ttl });
}
