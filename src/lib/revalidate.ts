import { revalidatePath } from "next/cache";

// Outside a Next.js request, such as in a script or a test, there is no page cache to clear.
export function refreshPaths(...paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {}
  }
}
