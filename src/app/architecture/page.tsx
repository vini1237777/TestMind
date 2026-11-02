import { permanentRedirect } from "next/navigation";

// Old link: the architecture details now live in the Features modal.
export default function ArchitecturePage() {
  permanentRedirect("/");
}
