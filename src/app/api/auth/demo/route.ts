import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import UserModel from "@/src/app/models/User";
import { demoEmail } from "@/src/lib/auth/demo";
import { hashPassword } from "@/src/lib/auth/password";
import { signedIn } from "@/src/lib/auth/respond";
import { connectDB } from "@/src/lib/mongodb";

// Signs in to the shared demo account, creating it the first time. Its password is
// random and never shown, so this route is the only way in.
export async function POST() {
  try {
    await connectDB();
    const email = demoEmail();
    const user =
      (await UserModel.findOne({ email })) ??
      (await UserModel.create({ email, passwordHash: await hashPassword(randomBytes(32).toString("hex")) }).catch(
        async (err) => {
          // Two first visits at once: the unique index keeps one, so read it back.
          if (err?.code === 11000) return UserModel.findOne({ email });
          throw err;
        },
      ));
    if (!user) throw new Error("Demo account missing");
    return signedIn({ id: String(user._id), email: user.email, demo: true });
  } catch (err) {
    console.error("Demo sign in error:", err);
    return NextResponse.json({ error: "Could not open the demo. Please try again." }, { status: 500 });
  }
}
