import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    throw new Error("TestMind server-side Sentry test error");
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, message: "Server-side Sentry test triggered" },
      { status: 500 },
    );
  }
}
