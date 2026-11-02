import { permanentRedirect } from "next/navigation";

// The old architecture page was replaced by /tech.
export default function ArchitecturePage() {
  permanentRedirect("/tech");
}
