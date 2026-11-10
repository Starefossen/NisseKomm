import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { NisseMusikk } from "../NisseMusikk";
import { setTimeOverride } from "@/lib/date-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("NisseMusikk dag 12", () => {
  it("er frosset, og tastaturet når ikke kontrollene under rimet", () => {
    window.HTMLMediaElement.prototype.pause = () => {};
    localStorage.clear();
    setTimeOverride({ month: 12, day: 12, hour: 8, minute: 0 });
    const el = document.createElement("div");
    act(() => createRoot(el).render(<NisseMusikk onClose={() => {}} />));
    expect(el.textContent).toContain("FROSSET");
    const spill = el.querySelector('[aria-label="Spill av"]');
    expect(spill?.closest("[inert]")).not.toBeNull();
  });
});
