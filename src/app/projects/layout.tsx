import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth/session";
import { ViewerProvider } from "@/src/app/components/Viewer";

// The proxy only sees that a cookie exists. This checks the session behind it.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/?next=/projects");
  return <ViewerProvider demo={Boolean(user.demo)}>{children}</ViewerProvider>;
}
