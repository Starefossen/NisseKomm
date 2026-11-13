import { describe, it, expect, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { SegmentStripe } from "../segmentstripe";
import { flaggTid, ordDiff, videoStatus, type Segment } from "@/lib/segmenter";

const svar = (x: unknown) =>
  ({ ok: true, json: async () => x }) as unknown as Response;

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const SEGS: Segment[] = [
  {
    s: 1,
    start: 0,
    slutt: 8,
    hash: "a",
    raw: "r1",
    replikk: "God morgen, Snøfall.",
    hørt: "God morgen, Snøfall.",
    flagg: [],
  },
  {
    s: 2,
    start: 7.75,
    slutt: 20,
    hash: "b",
    raw: "r2",
    replikk: "Hør nå, Kristian.",
    hørt: "Hør Kristian, sulele.",
    flagg: ["ekstra ord: sulele"],
  },
];

describe("ordDiff og flaggTid", () => {
  it("markerer manglende og ekstra ord", () => {
    expect(ordDiff("Hør nå, Kristian.", "Hør Kristian, sulele.")).toEqual([
      { w: "Hør", t: "lik" },
      { w: "nå", t: "mangler" },
      { w: "Kristian", t: "lik" },
      { w: "sulele", t: "ekstra" },
    ]);
    expect(ordDiff("Lucia-morgen", "luciamorgen")[0].t).toBe("lik");
  });
  it("hopper til flaggets tid i videoen", () => {
    expect(flaggTid(SEGS[1], "0:03 mikrofonen svever")).toBe(10.75);
    expect(flaggTid(SEGS[1], "ekstra ord: sulele")).toBe(17);
    expect(flaggTid(SEGS[1], "mangler: nå")).toBe(7.75);
  });
});

describe("videoStatus", () => {
  const segs = [
    { s: 1, start: 0 },
    { s: 2, start: 20 },
    { s: 3, start: 40 },
  ];
  const st = (d: Record<number, object>, hele?: object) =>
    videoStatus(segs, (n) => d[n], hele);
  it("verste segment bestemmer", () => {
    expect(
      st({
        1: { vurdering: "lag_paa_nytt" },
        2: { vurdering: "kutt", kutt: { retning: "slutt", t: 11 } },
      }),
    ).toEqual({ steg: "nytt", tekst: "Venter på nytt opptak: s1 (17 kr)" });
    expect(
      st({ 2: { vurdering: "kutt", kutt: { retning: "slutt", t: 11 } } }).tekst,
    ).toBe("Venter på kutt: s2 @0:31");
    expect(st({ 1: { vurdering: "ok" }, 2: { kuttsjekk: {} } }).tekst).toBe(
      "1 av 3 vurdert",
    );
    const alle = {
      1: { vurdering: "godkjent" },
      2: { vurdering: "ok" },
      3: { vurdering: "godkjent" },
    };
    expect(st(alle).steg).toBe("klar");
    expect(st(alle, { vurdering: "godkjent" }).slutt).toBe("ok");
    expect(
      st({ ...alle, 2: { vurdering: "godkjent" } }, { vurdering: "godkjent" })
        .slutt,
    ).toBe("godkjent");
    expect(st(alle, { vurdering: "lag_paa_nytt" }).steg).toBe("klar");
  });
});

describe("SegmentStripe", () => {
  it("én brikke per segment, egen vurdering, tastene virker på valgt segment", async () => {
    const poster: unknown[] = [];
    globalThis.fetch = jest.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const u = String(url);
        if (u.startsWith("/api/guide/segmenter")) return svar(SEGS);
        if (init?.method === "POST") {
          poster.push(JSON.parse(String(init.body)));
          return svar({ vurderinger: {} });
        }
        return svar({
          "video/julius/dag-13#s1": { vurdering: "godkjent" },
        });
      },
    ) as typeof fetch;
    const side = jest.fn();
    window.addEventListener("keydown", side);
    const boks = document.createElement("div");
    document.body.appendChild(boks);
    const root = createRoot(boks);
    await act(async () => {
      root.render(
        <SegmentStripe path="video/julius/dag-13-v2.mp4">
          <p>vanlig</p>
        </SegmentStripe>,
      );
    });
    await act(async () => {});
    expect(
      boks.querySelector('[data-testid="segment-sum"]')!.textContent,
    ).toContain("1 av 2 vurdert");
    expect(boks.querySelectorAll("[data-seg]")).toHaveLength(2);
    const tast = (key: string) =>
      act(async () => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true }),
        );
      });
    await tast("2");
    expect(
      boks.querySelector('[data-testid="ord-diff"] .line-through')!.textContent,
    ).toBe("nå ");
    expect(boks.textContent).toContain("Maskinen fant:");
    await tast("g");
    expect(poster).toEqual([
      {
        path: "video/julius/dag-13#s2",
        vurdering: "godkjent",
        notat: "",
        raw: "r2",
      },
    ]);
    // The page's G (the join) never saw it.
    expect(side).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "g" }),
    );
    // ✂: K stores the cut at the player's time inside the segment.
    boks.querySelector("video")!.currentTime = 12;
    await tast("k");
    expect(poster.at(-1)).toEqual({
      path: "video/julius/dag-13#s2",
      vurdering: "kutt",
      kutt: { retning: "slutt", t: 4.25 },
      raw: "r2",
    });
    // A click on the timeline selects the segment there.
    await act(async () => {
      boks.querySelector<HTMLButtonElement>('[data-seg="1"]')!.click();
    });
    expect(boks.textContent).toContain("Spill s1");
    await tast("Escape");
    await tast("g");
    expect(side).toHaveBeenCalledWith(expect.objectContaining({ key: "g" }));
    window.removeEventListener("keydown", side);
    act(() => root.unmount());
  });

  it("uten segmenter.json: vanlig spiller", async () => {
    globalThis.fetch = jest.fn(async () => svar([])) as typeof fetch;
    const boks = document.createElement("div");
    const root = createRoot(boks);
    await act(async () => {
      root.render(
        <SegmentStripe path="video/julius/dag-20.mp4">
          <p>vanlig</p>
        </SegmentStripe>,
      );
    });
    await act(async () => {});
    expect(boks.textContent).toBe("vanlig");
    act(() => root.unmount());
  });
});
