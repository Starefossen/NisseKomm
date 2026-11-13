#!/usr/bin/env node
// Gjennomgang's save feedback in WebKit: every action shows «Lagrer…», then
// «✓ …» or «Ikke lagret: …», and the page state updates without a reload.
// Usage: BASE_URL=http://localhost:PORT node scripts/lagring-webkit.mjs
// (a lan-mode dev server with PARENT_CODE; MEDIA_DIR must be a scratch copy, it writes verdicts).
import { webkit } from "playwright";

const base = process.env.BASE_URL;
const PARENT_CODE = process.env.PARENT_CODE ?? "NORDPOL-DEV2026";
if (!base) throw new Error("BASE_URL mangler");
const side = (id) =>
  `${base}/nissemor-guide/gjennomgang?id=${encodeURIComponent(id)}`;

const browser = await webkit.launch();
const page = await browser.newPage({
  viewport: { width: 1180, height: 820 },
});
const feil = [];
const sjekk = async (navn, f) => {
  try {
    await f();
    console.log(`ok   ${navn}`);
  } catch (e) {
    feil.push(navn);
    console.log(`FEIL ${navn}: ${e.message.split("\n")[0]}`);
  }
};
const melding = (boks, tekst) =>
  boks
    .locator("[data-lagring]")
    .filter({ hasText: tekst })
    .first()
    .waitFor({ timeout: 15000 });
const api = async (id) =>
  (
    await page.evaluate(() =>
      fetch("/api/media/vurdering").then((r) => r.json()),
    )
  )[id];

await page.request.post(`${base}/api/auth/login`, {
  data: { code: PARENT_CODE },
  headers: { Origin: base },
});

const A = "dag/01/rampestrek";
const boks = page.locator("#vurdering-rampestrek");

await sjekk("Godkjent/OK: Lagrer… → ✓ Lagret, lagret på serveren", async () => {
  await page.goto(side(A));
  await boks.locator('[data-verdikt="godkjent"]').waitFor({ timeout: 60000 });
  // A second click clears the verdict: pick the one not saved now.
  const mål = (await api(A))?.vurdering === "godkjent" ? "ok" : "godkjent";
  await boks.locator(`[data-verdikt="${mål}"]`).click();
  await melding(boks, "✓ Lagret");
  if ((await api(A))?.vurdering !== mål) throw new Error("ikke lagret");
});

await sjekk("Hurtigmerke ⇧1: ✓ Lagret og knappen trykket inn", async () => {
  await page.keyboard.press("Shift+Digit1");
  await melding(boks, "✓ Lagret");
  await boks
    .locator('[data-tagg="1"][aria-pressed="true"]')
    .waitFor({ timeout: 5000 });
});

await sjekk("Feil fra serveren: Ikke lagret: grunn", async () => {
  await page.route("**/api/media/vurdering", (r) =>
    r.request().method() === "POST"
      ? r.fulfill({ status: 500, body: "disken er full" })
      : r.continue(),
  );
  await boks.locator('[data-verdikt="ok"]').click();
  await melding(boks, "Ikke lagret: disken er full");
  await page.unroute("**/api/media/vurdering");
});

await sjekk(
  "Neste: notatet følger ikke med, og lagres på forrige",
  async () => {
    await boks.locator("input").fill("notat på A");
    await page.getByRole("link", { name: /Neste/ }).first().click();
    await page.waitForURL((u) => !u.href.includes(encodeURIComponent(A)));
    const ny = page.locator("[id^=vurdering-] input").first();
    await ny.waitFor({ timeout: 30000 });
    const verdi = await ny.inputValue();
    if (verdi === "notat på A") throw new Error("notatet ble med til neste");
    await page.waitForTimeout(500);
    if ((await api(A))?.notat !== "notat på A")
      throw new Error("notatet ble ikke lagret på A");
  },
);

await sjekk(
  "Manusdag: G godkjenner alle segmentene, «N av M godkjent» oppdateres",
  async () => {
    await page.goto(side("manus/julius/dag-05"));
    const st = page.getByTestId("manus-status");
    await st.waitFor({ timeout: 60000 });
    const m = (await st.innerText()).match(/(\d+) av (\d+)/);
    await page.keyboard.press("g");
    await page
      .locator("#vurdering-dagmanus [data-lagring]")
      .filter({ hasText: /✓ \d+ godkjent/ })
      .waitFor({ timeout: 15000 });
    await st
      .filter({ hasText: `${m[2]} av ${m[2]} godkjent` })
      .waitFor({ timeout: 5000 });
  },
);

await browser.close();
if (feil.length) {
  console.log(`\n${feil.length} feilet`);
  process.exit(1);
}
console.log("\nalle handlinger gir tilbakemelding");
