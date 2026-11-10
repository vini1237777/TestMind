import Intro from "./components/Intro";
import { getCurrentUser } from "@/src/lib/auth/session";

type Params = { next?: string | string[]; create?: string | string[] };

export default async function HomePage({ searchParams }: { searchParams: Promise<Params> }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const next = typeof params.next === "string" ? params.next : null;
  // Arriving from a workspace link opens sign in, and from the demo banner opens create account.
  const openAuth = params.create ? "signup" : next ? "signin" : null;
  return <Intro email={user?.email ?? null} next={next} openAuth={openAuth} />;
}
