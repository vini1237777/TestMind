import { NextResponse } from "next/server";
import UserModel from "@/src/app/models/User";
import { readCredentials } from "@/src/lib/auth/credentials";
import { hashPassword } from "@/src/lib/auth/password";
import { signedIn } from "@/src/lib/auth/respond";
import { connectDB } from "@/src/lib/mongodb";
import { demoEmail } from "@/src/lib/auth/demo";

const TAKEN = "An account with this email already exists. Sign in instead.";

export async function POST(req: Request) {
  try {
    const input = await readCredentials(req);
    if ("error" in input) return NextResponse.json(input, { status: 400 });

    if (input.email === demoEmail()) {
      return NextResponse.json({ error: "This email is kept for the demo account. Use Try the demo instead.", field: "email" }, { status: 409 });
    }

    await connectDB();
    if (await UserModel.exists({ email: input.email })) {
      return NextResponse.json({ error: TAKEN, field: "email" }, { status: 409 });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await UserModel.create({ email: input.email, passwordHash }).catch((err) => {
      // Two sign ups with one email at the same moment: the unique index stops the second.
      if (err?.code === 11000) return null;
      throw err;
    });
    if (!user) return NextResponse.json({ error: TAKEN, field: "email" }, { status: 409 });

    return signedIn({ id: String(user._id), email: user.email }, 201);
  } catch (err) {
    console.error("Sign up error:", err);
    return NextResponse.json({ error: "Could not create the account. Please try again." }, { status: 500 });
  }
}
