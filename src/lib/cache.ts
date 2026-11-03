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

// Lists of projects and suites are cached for a minute. Call this after any write
// (new score, added cases, new suite...) so the next load shows the fresh data.
export async function clearListCache() {
  try {
    for (const match of ["*/api/projects*", "*/api/suites*"]) {
      let cursor: string | number = 0;
      do {
        const [next, keys]: [string | number, string[]] = await redis.scan(cursor, { match, count: 100 });
        if (keys.length) await redis.del(...keys);
        cursor = next;
      } while (String(cursor) !== "0");
    }
  } catch (err) {
    // A stale list for a minute is better than a failed save.
    console.error("clearListCache failed", err);
  }
}
