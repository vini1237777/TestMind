// Signs a test user in. Actions and routes read the session from withSessionToken
// here, since there is no request and so no cookie.
export async function signInAs(email: string) {
  const User = (await import("../../../src/app/models/User")).default;
  const { createSession, withSessionToken } = await import("../../../src/lib/auth/session");
  const user = await User.create({ email, passwordHash: "scrypt:unused:unused" });
  const { token } = await createSession(String(user._id));
  return {
    id: String(user._id),
    email,
    token,
    as: <T>(work: () => Promise<T>) => withSessionToken(token, work),
  };
}
