import { NextResponse } from "next/server";
import UserModel from "@/src/app/models/User";
import { readCredentials } from "@/src/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/src/lib/auth/password";
import { signedIn } from "@/src/lib/auth/respond";
import { connectDB } from "@/src/lib/mongodb";

const WRONG = "Email or password is incorrect.";

// Compared against when the email is unknown, so both cases take about the same time.
let decoy: Promise<string> | undefined;

export async function POST(req: Request) {
  try {
    const input = await readCredentials(req);
    // A short password cannot match, and naming the rule here would say nothing new.
    if ("error" in input) {
      return input.field === "email"
        ? NextResponse.json(input, { status: 400 })
        : NextResponse.json({ error: WRONG }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: input.email })
      .select("+passwordHash")
      .lean<{ _id: unknown; email: string; passwordHash: string } | null>();

    decoy ??= hashPassword("decoy password for timing");
    const ok = await verifyPassword(input.password, user?.passwordHash ?? (await decoy));
    if (!user || !ok) return NextResponse.json({ error: WRONG }, { status: 401 });

    return signedIn({ id: String(user._id), email: user.email });
  } catch (err) {
    console.error("Sign in error:", err);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
