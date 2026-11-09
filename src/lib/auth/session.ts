import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomBytes } from "node:crypto";
import SessionModel from "@/src/app/models/Session";
import UserModel from "@/src/app/models/User";
import { connectDB } from "@/src/lib/mongodb";

export const SESSION_COOKIE = "tm_session";
export const SESSION_DAYS = 30;

export type CurrentUser = { id: string; email: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await connectDB();
  await SessionModel.create({ _id: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  await connectDB();
  await SessionModel.deleteOne({ _id: hashToken(token) });
}

export async function userFromToken(token: string | null | undefined): Promise<CurrentUser | null> {
  if (!token || token.length > 200) return null;
  await connectDB();
  const session = await SessionModel.findById(hashToken(token)).lean<{ userId: string; expiresAt: Date } | null>();
  // MongoDB removes expired sessions about once a minute, so the date is checked here too.
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  const user = await UserModel.findById(session.userId).lean<{ _id: unknown; email: string } | null>();
  return user ? { id: String(user._id), email: user.email } : null;
}

// Scripts and tests run outside a request, so they pass the token in here instead of a cookie.
const tokenScope = new AsyncLocalStorage<string>();
export const withSessionToken = <T>(token: string, work: () => Promise<T>) => tokenScope.run(token, work);

export async function readSessionToken() {
  const scoped = tokenScope.getStore();
  if (scoped !== undefined) return scoped;
  // Not caught: Next.js marks a page as per request by throwing from cookies() during a build.
  const { cookies } = await import("next/headers");
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  return userFromToken(await readSessionToken());
}

export const sessionCookie = (token: string, expiresAt: Date) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires: expiresAt,
});
