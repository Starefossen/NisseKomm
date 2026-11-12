/**
 * @jest-environment node
 */
import { describe, it, expect, afterAll } from "@jest/globals";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { callTool } from "@/lib/mcp/tools";

const dir = mkdtempSync(path.join(tmpdir(), "vurd-"));
process.env.MEDIA_DIR = dir;
writeFileSync(
  path.join(dir, "media-vurdering.json"),
  JSON.stringify({
    "video/julius/dag-01-v3.mp4": {
      vurdering: "lag_paa_nytt",
      notat: "for mørk\nlyd hakker",
      oppdatert: "2026-11-10T08:00:00.000Z",
    },
    "dag/04/gaatekart": {
      notat: "sjekk",
      oppdatert: "2026-11-11T09:30:00.000Z",
    },
    "dag/05/gaatekart": {
      vurdering: "godkjent",
      notat: "fin",
      oppdatert: "2026-11-09T09:30:00.000Z",
      versjon: "000000000000",
    },
    "historien/start": {
      vurdering: "godkjent",
      oppdatert: "2026-11-12T10:00:00.000Z",
    },
  }),
);
afterAll(() => rmSync(dir, { recursive: true }));

describe("list_vurderinger", () => {
  it("er bare for foreldre", async () => {
    await expect(callTool("read", "list_vurderinger")).rejects.toThrow();
  });

  it("viser åpne, nyeste først, som kompakt tekst", async () => {
    expect(await callTool("parent", "list_vurderinger")).toBe(
      "3 åpne av 4\n" +
        "dag/04/gaatekart | - | 2026-11-11 09:30 | sjekk\n" +
        "video/julius/dag-01-v3.mp4 | lag_paa_nytt | 2026-11-10 08:00 | for mørk / lyd hakker\n" +
        "dag/05/gaatekart | (ny versjon) forrige: godkjent | 2026-11-09 09:30 | fin",
    );
  });

  it("filtrerer på alle, siden og prefiks", async () => {
    const alle = await callTool("parent", "list_vurderinger", {
      status: "alle",
    });
    expect(alle.split("\n")[1]).toMatch(/^historien\/start \| godkjent/);
    expect(
      await callTool("parent", "list_vurderinger", {
        siden: "2026-11-11T00:00:00Z",
      }),
    ).toBe("1 åpne av 2\ndag/04/gaatekart | - | 2026-11-11 09:30 | sjekk");
    expect(
      await callTool("parent", "list_vurderinger", { prefiks: "video/" }),
    ).toMatch(/^1 åpne av 1\nvideo\//);
    await expect(
      callTool("parent", "list_vurderinger", { siden: "tull" }),
    ).rejects.toThrow();
  });
});
