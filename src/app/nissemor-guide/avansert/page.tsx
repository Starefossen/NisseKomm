import { permanentRedirect } from "next/navigation";

// Old URL kept so bookmarks still work.
export default function Side() {
  permanentRedirect("/nissemor-guide/innstillinger");
}
