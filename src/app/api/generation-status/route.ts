import { NextResponse } from "next/server";
import { GENERATION_PAUSED, isQueueAvailable } from "@/src/lib/queue/generation-queue";

// Lets the page say up front when generation is paused. It only reads a cached answer,
// so the proxy leaves it out of the rate limit.
export const dynamic = "force-dynamic";

export async function GET() {
  const available = await isQueueAvailable();
  return NextResponse.json(available ? { available } : { available, message: GENERATION_PAUSED });
}
