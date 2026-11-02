import { permanentRedirect } from "next/navigation";

// Tech details now live in the Features modal ("How it's built" tab).
export default function TechPage() {
  permanentRedirect("/");
}
