import Intro from "./components/Intro";
import { getCurrentUser } from "@/src/lib/auth/session";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const next = typeof params.next === "string" ? params.next : null;
  return <Intro email={user?.email ?? null} next={next} />;
}
