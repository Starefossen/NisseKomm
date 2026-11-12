/**
 * @jest-environment node
 */
import { it, expect, afterAll } from "@jest/globals";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { callTool, MAX_RESPONSE_BYTES } from "@/lib/mcp/tools";

const dir = mkdtempSync(path.join(tmpdir(), "vurd-alle-"));
process.env.MEDIA_DIR = dir;
const v: Record<string, object> = {};
for (let i = 1; i <= 120; i++) {
  const d = String(i % 24 || 24).padStart(2, "0");
  const t = `2026-11-${String(1 + (i % 11)).padStart(2, "0")}T08:${String(i % 60).padStart(2, "0")}:00.000Z`;
  const notat = "lang vurdering med mye tekst ".repeat(4) + i;
  const id =
    i % 4 === 0
      ? `video/julius/dag-${d}.old-${i}.mp4`
      : i % 4 === 1
        ? `dag/${d}/seksjon-${i}`
        : `video/julius/dag-${d}-v${i}.mp4`;
  v[id] = {
    vurdering: ["ok", "godkjent", "Lag på nytt", undefined][i % 4],
    notat,
    oppdatert: t,
  };
}
writeFileSync(path.join(dir, "media-vurdering.json"), JSON.stringify(v));
afterAll(() => rmSync(dir, { recursive: true }));

it("status=alle fungerer også over svartaket", async () => {
  const out = await callTool("parent", "list_vurderinger", { status: "alle" });
  expect(Buffer.byteLength(out)).toBeLessThanOrEqual(MAX_RESPONSE_BYTES);
  expect(out).toMatch(/^\d+ åpne av 120\n/);
  expect(out).toMatch(/linjer til utelatt/);
});
