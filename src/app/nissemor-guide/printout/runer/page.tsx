import { permanentRedirect } from "next/navigation";

// Old URL: the board and the answer key are now separate prints.
export default function RunerSide() {
  permanentRedirect("/nissemor-guide/printout/runetavle");
}
