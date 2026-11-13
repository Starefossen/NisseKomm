import { describe, it, expect, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { LysbordBilde, pikselkunst } from "../lysbord";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  disconnect() {}
};

const tast = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
const lysbord = () =>
  document.querySelector<HTMLElement>("[data-testid=lysbord]");

function monter() {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const boks = document.createElement("div");
  boks.id = "vurdering-a.png";
  const godkjenn = jest.fn();
  boks.innerHTML = `<button data-verdikt="godkjent"></button><span data-lagring></span>`;
  boks.querySelector("button")!.addEventListener("click", godkjenn);
  document.body.appendChild(boks);
  const root = createRoot(div);
  act(() =>
    root.render(
      <>
        <LysbordBilde
          src="/media/a.png"
          alt="a"
          gammel="/media/a.old-1.png"
          vurderId="dag/a.png"
        />
        <LysbordBilde src="/media/b.png" alt="b" />
      </>,
    ),
  );
  return {
    godkjenn,
    rydd: () => {
      act(() => root.unmount());
      div.remove();
      boks.remove();
    },
  };
}

describe("Lysbord", () => {
  it("opens on click, Z zooms, V swaps old/new at the same zoom, Esc closes", () => {
    const { rydd } = monter();
    act(() => document.querySelector<HTMLImageElement>("img")!.click());
    expect(lysbord()).not.toBeNull();
    tast("z");
    tast("z");
    expect(lysbord()!.dataset.skala).toBe("2.000");
    tast("v");
    expect(lysbord()!.dataset.vis).toBe("gammel");
    expect(lysbord()!.dataset.skala).toBe("2.000");
    expect(lysbord()!.querySelector("img")!.getAttribute("src")).toBe(
      "/media/a.old-1.png",
    );
    tast("Escape");
    expect(lysbord()).toBeNull();
    rydd();
  });

  it("F opens, arrows walk the group and reset zoom", () => {
    const { rydd } = monter();
    tast("f");
    expect(lysbord()!.querySelector("img")!.getAttribute("src")).toBe(
      "/media/a.png",
    );
    tast("z");
    tast("ArrowRight");
    expect(lysbord()!.querySelector("img")!.getAttribute("src")).toBe(
      "/media/b.png",
    );
    expect(lysbord()!.dataset.skala).toBe("1.000");
    tast("ArrowLeft");
    expect(lysbord()!.querySelector("img")!.getAttribute("src")).toBe(
      "/media/a.png",
    );
    tast("Escape");
    rydd();
  });

  it("G reaches the Vurder box and not the page's own handler", () => {
    const { godkjenn, rydd } = monter();
    const side = jest.fn();
    tast("f");
    window.addEventListener("keydown", side);
    tast("g");
    expect(godkjenn).toHaveBeenCalledTimes(1);
    expect(side).not.toHaveBeenCalled();
    expect(lysbord()!.textContent).toContain("Godkjent");
    window.removeEventListener("keydown", side);
    tast("Escape");
    rydd();
  });

  it("pixel art by path or small size", () => {
    expect(pikselkunst("/media/spill/piksel/torget.png")).toBe(true);
    expect(pikselkunst("/media/x/ikon/nokkel.png")).toBe(true);
    expect(pikselkunst("/media/strek/dag01.png", 1024)).toBe(false);
    expect(pikselkunst("/media/strek/dag01.png", 64)).toBe(true);
  });
});
