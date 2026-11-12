// Screenshots the two rampestrek sheets as PNG. Needs a running server in lan mode.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// Never the repo root: the PNGs are review output, not source.
const UT = process.env.UT ?? path.join(os.tmpdir(), "nissekomm-strekark");
mkdirSync(UT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 3 });
const r = await page.request.post(`${BASE}/api/auth/login`, {
  headers: { origin: BASE },
  data: { code: process.env.PARENT_CODE ?? "NORDPOL-DEV2026" },
});
if (!r.ok()) throw new Error(`innlogging feilet: ${r.status()}`);
await page.goto(`${BASE}/nissemor-guide/printout/rampestreker`);
await page.waitForSelector("[data-strekark]");
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
// Guide-only marks and the dev TIDSMASKIN button must not end up in the PNG.
await page.addStyleTag({ content: "[data-kandidat]{display:none!important}" });
await page.evaluate(() =>
  [...document.querySelectorAll("button")]
    .filter((b) => b.textContent?.includes("TIDSMASKIN"))
    .forEach((b) => b.remove()),
);
for (const n of [1, 2]) {
  const fil = path.join(UT, `strek-ark-${n}.png`);
  await page.locator(`[data-strekark="${n}"]`).screenshot({ path: fil });
  console.log(fil);
}
await browser.close();
