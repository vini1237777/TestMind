import { NextResponse } from "next/server";
import { claimOwnerlessProjects } from "./access";
import { createSession, sessionCookie, type CurrentUser } from "./session";

// Starts a session, hands over any projects waiting for the owner account, and sets the cookie.
export async function signedIn(user: CurrentUser, status = 200) {
  const { token, expiresAt } = await createSession(user.id);
  await claimOwnerlessProjects(user);
  const res = NextResponse.json({ user: { email: user.email } }, { status });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}
