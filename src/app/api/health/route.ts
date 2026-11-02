import { NextResponse } from "next/server";

// Liveness probe for Railway. Deliberately touches no external service, so a
// slow database or LLM provider can't make the platform kill a healthy process.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", uptime: Math.round(process.uptime()) });
}
