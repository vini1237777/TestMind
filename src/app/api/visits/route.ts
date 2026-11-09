import { NextRequest, NextResponse } from "next/server";
import Visitor from "../../models/Visitor";
import { connectDB } from "../../../lib/mongodb";
import { isBot, visitorId } from "../../../lib/visitors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.VISIT_HASH_SECRET || process.env.MONGODB_URI;
  if (!secret) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  try {
    await connectDB();

    const ip =
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (ip && !isBot(req.headers.get("user-agent"))) {
      await Visitor.updateOne(
        { _id: visitorId(ip, secret) },
        { $setOnInsert: { firstSeenAt: new Date() } },
        { upsert: true },
      );
    }

    return NextResponse.json({ visitors: await Visitor.estimatedDocumentCount() });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
