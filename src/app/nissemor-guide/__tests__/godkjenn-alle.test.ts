/** @jest-environment node */
/**
 * Every review type Gjennomgang and the day view can approve: POST «godkjent»
 * the way the button does, read it back in a fresh module registry (a server
 * restart), and the cell and the progress bar show ✓. A new type that cannot be
 * approved fails here.
 */
import { describe, it, expect, jest, beforeAll } from "@jest/globals";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import manus from "@/data/julius-manus.json";

jest.mock("@/lib/media-server", () => ({
  ...jest.requireActual<object>("@/lib/media-server"),
  authorizeMedia: async () => null,
}));

const pad = (n: number) => String(n).padStart(2, "0");
let dir: string;

async function oppsett() {
  const gs = await import("@/lib/guide-sesong");
  const sesong = {
    dager: gs.dagListe(),
    for: gs.forSesongen(),
    historien: gs.historien(),
    promo: [],
  } as unknown as import("../_kveld/felles").Sesong;
  const el = await import("../gjennomgang/elementer");
  const dager = Array.from({ length: 24 }, (_, i) => i + 1);
  // Every file a cell points at exists (a sketch, a video, a clip), plus a grid image.
  const media = new Set<string>(["spill/piksel/torget.png"]);
  for (const n of dager) {
    media.add(`strek/dag${pad(n)}.png`);
    media.add(`audio/rampenissen/dag-${pad(n)}.mp3`);
    media.add(`video/julius/dag-${pad(n)}.mp4`);
  }
  media.add("video/tv/landsby-rolig.mp4");
  media.add("promo/julius-promo-A.mp4");
  media.add("promo/julius-promo-B.mp4");
  const filer = [...media].map((p) => ({ path: p, size: 1 }));
  const liste = el.alleElementer("dag", sesong, filer, 3);
  return { sesong, el, filer, liste, media };
}

describe("godkjent holder etter omstart, for hver vurderingstype", () => {
  let ids: string[] = [];
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "godkjenn-alle-"));
    process.env.MEDIA_DIR = dir;
    const { el, liste, media } = await oppsett();
    for (const p of media) {
      await mkdir(path.dirname(path.join(dir, p)), { recursive: true });
      await writeFile(path.join(dir, p), p);
    }
    const segmenter = Object.entries(
      manus as Record<string, { s: number }[]>,
    ).flatMap(([d, ss]) =>
      ss.flatMap((x) => [
        `manus/julius/dag-${pad(Number(d))}#s${x.s}`,
        `video/julius/dag-${pad(Number(d))}#s${x.s}`,
      ]),
    );
    const dagvisning = Array.from({ length: 24 }, (_, i) => [
      `dag/${pad(i + 1)}/delsystemer`,
      `dag/${pad(i + 1)}/varden`,
    ]).flat();
    ids = [
      ...new Set([
        ...liste.map((e) => e.id).filter(el.egenVurdering),
        ...segmenter,
        ...dagvisning,
      ]),
    ];
    // The types this test must cover: the matrix columns and every extra group.
    const typer = new Set(liste.map((e) => e.gruppe));
    for (const t of [
      "rampestrek",
      "gaate",
      "julius",
      "radio",
      "tekster",
      "utskrifter",
      "oppsett",
      "Julius-manus",
      "Historien",
      "Før sesongen",
      "Snøfall TV",
    ])
      expect(typer).toContain(t);

    const { POST } = await import("@/app/api/media/vurdering/route");
    for (const id of ids) {
      const svar = await POST(
        new Request("http://x/api/media/vurdering", {
          method: "POST",
          body: JSON.stringify({ path: id, vurdering: "godkjent", notat: "" }),
        }) as never,
      );
      expect([id, svar.status]).toEqual([id, 200]);
    }
  }, 120_000);

  it("GET etter omstart: godkjent, ikke «ny versjon»", async () => {
    jest.resetModules();
    const { GET } = await import("@/app/api/media/vurdering/route");
    const vurd = (await (
      await GET(new Request("http://x") as never)
    ).json()) as Record<string, { vurdering?: string; forrige?: unknown }>;
    const feil = ids.filter(
      (id) => vurd[id]?.vurdering !== "godkjent" || vurd[id]?.forrige,
    );
    expect(feil).toEqual([]);
  }, 60_000);

  it("cellen og fremdriften viser ✓ for hvert element", async () => {
    jest.resetModules();
    const { GET } = await import("@/app/api/media/vurdering/route");
    const vurd = await (await GET(new Request("http://x") as never)).json();
    const { el, liste, filer } = await oppsett();
    const ko = await import("../gjennomgang/ko");
    const k = { filer, vurderinger: vurd };
    const server = {
      forbruk: { brukt: 0, igjen: 1, budsjett: 1, fra: "" },
      duplikater: [],
      jobber: {},
      manus: Object.fromEntries(
        Object.entries(manus as Record<string, { s: number }[]>).map(
          ([d, ss]) => [d, ss.map((x) => x.s)],
        ),
      ),
    };
    const fd = ko.fremdrift(liste, k, ko.byggKo(liste, k, server));
    const ikke = fd.poster
      .filter((p) => p.status !== "godkjent")
      .map((p) => `${p.id} ${p.status} ${el.tilstand(p, k).celle}`);
    expect(ikke).toEqual([]);
  }, 60_000);
});

describe("dagseksjonene hasher bare sine egne felt", () => {
  it("en endret oppsettskisse eller sjekkliste rører ikke gåtekartet, og omvendt", async () => {
    const { utsnitt } = await import("@/lib/vurdering-versjon");
    const kilde = [
      "### Dag 4",
      "",
      "- **Brikke H:** sju sko.",
      "- **Oppsettskisse:** EXACTLY SEVEN shoes.",
      "- **Oppsett:** 5 min.",
      "- **Sjekkliste:**",
      "  - Skriv ut",
      "- **Utskrifter:** `dag04-skokort.pdf`.",
      "",
      "4 | fr | Rampenissen i pappas sko",
      "Sju sko i ring",
    ].join("\n");
    const endret = kilde
      .replace("EXACTLY SEVEN", "SEVEN")
      .replace("Skriv ut", "Skriv ut to");
    expect(utsnitt("dag/04/gaatekart", endret)).toBe(
      utsnitt("dag/04/gaatekart", kilde),
    );
    expect(utsnitt("dag/04/rampestrek", endret)).toBe(
      "### Dag 4\n4 | fr | Rampenissen i pappas sko",
    );
    expect(utsnitt("dag/04/utskrifter", kilde)).toContain("dag04-skokort");
    expect(utsnitt("dag/04/utskrifter", kilde)).not.toContain("Oppsett");
    expect(utsnitt("dag/04/kveld", endret)).not.toBe(
      utsnitt("dag/04/kveld", kilde),
    );
    expect(utsnitt("dag/04/kveld", kilde)).not.toContain("SEVEN");
  });
});
