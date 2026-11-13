import { permanentRedirect } from "next/navigation";

// Old URL kept so bookmarks still work: the queue replaced this list.
export default function Side() {
  permanentRedirect("/nissemor-guide/gjennomgang");
}
