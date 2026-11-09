import { z } from "zod";
import { PASSWORD_MAX, PASSWORD_MIN } from "./password";

export type AuthField = "email" | "password";

const CredentialsSchema = z.object({
  email: z
    .string({ error: "Enter your email." })
    .trim()
    .toLowerCase()
    .min(1, "Enter your email.")
    .max(254, "This email is too long.")
    .pipe(z.email("Enter an email like name@example.com.")),
  password: z
    .string({ error: "Enter your password." })
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
});

// The first problem found, with the field it belongs to, so the form can show it in place.
export async function readCredentials(
  req: Request,
): Promise<{ email: string; password: string } | { error: string; field?: AuthField }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: "The request body must be valid JSON." };
  }
  const parsed = CredentialsSchema.safeParse(body);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  const field = issue?.path[0];
  return { error: issue?.message ?? "Check your email and password.", field: field === "email" || field === "password" ? field : undefined };
}
