import { NextResponse } from "next/server";
import { createSession, sessionCookie, type CurrentUser } from "./session";

// Starts a session and sets the cookie.
export async function signedIn(user: CurrentUser, status = 200) {
  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({ user: { email: user.email } }, { status });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}
