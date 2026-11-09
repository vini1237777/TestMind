import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth/session";

// The proxy only sees that a cookie exists. This checks the session behind it.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUser())) redirect("/?next=/projects");
  return children;
}
