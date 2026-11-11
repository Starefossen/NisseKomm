#!/usr/bin/env node
// Measures vertical overflow per window at iPad and desktop sizes.
// Usage: BASE=http://localhost:3000 DAYS=10,22 OUT=/tmp/scroll node scripts/scroll-audit.mjs
// Needs a dev server with `mise run dev` env (TEST_MODE, lan, dev codes).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DAYS = (process.env.DAYS ?? "10,22").split(",").map(Number);
const OUT = process.env.OUT;
const KID = process.env.KID_CODE ?? "snø lykt rein";
const PARENT = process.env.PARENT_CODE ?? "NORDPOL-DEV2026";
const SIZES = process.env.SIZES
  ? JSON.parse(process.env.SIZES)
  : [
      [1024, 768],
      [768, 1024],
      [1440, 900],
    ];
const APPS = [
  "JULIUS DAGBOK",
  "NISSEMAIL",
  "KODETERMINAL",
  "SNØFALL TV",
  "NISSENET",
  "KALENDER",
  "EVENTYR",
  "RUNETAVLE",
  "NISSEKRYPTO",
  "SYMBOLSKANNER",
  "NISSEMUSIKK",
  "BREVFUGLER",
  "NISSESTATS",
];
const GUIDE = [
  "",
  "/i-kveld",
  "/oppdrag",
  "/bonusoppdrag",
  "/eventyr",
  "/symboler",
  "/brevfugler",
  "/merker",
  "/fasit",
  "/forberedelser",
];
if (OUT) mkdirSync(OUT, { recursive: true });

// Page overflow plus every scroll container that actually scrolls.
const measure = () => {
  const d = document.scrollingElement;
  const res = { page: d.scrollHeight - d.clientHeight, inner: [] };
  for (const el of document.querySelectorAll("*")) {
    const oy = getComputedStyle(el).overflowY;
    if (!/auto|scroll/.test(oy) || el.clientHeight === 0) continue;
    const over = el.scrollHeight - el.clientHeight;
    if (over > 2)
      res.inner.push({
        over,
        h: el.clientHeight,
        cls: String(el.className).slice(0, 60),
      });
  }
  return res;
};

const rows = [];
const report = async (page, name) => {
  await page.waitForTimeout(1200);
  const m = await page.evaluate(measure);
  const worst = Math.max(m.page, ...m.inner.map((i) => i.over), 0);
  rows.push({
    name,
    page: m.page,
    inner: m.inner.map((i) => i.over).join("/"),
  });
  console.log(
    `${name.padEnd(40)} page=${String(m.page).padStart(5)} inner=${m.inner.map((i) => `${i.over}(${i.h})`).join(" ") || "-"}`,
  );
  if (OUT && worst > 40)
    await page.screenshot({ path: `${OUT}/${name.replace(/\W+/g, "_")}.png` });
};

const browser = await chromium.launch();
for (const day of DAYS) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate((day) => {
      localStorage.setItem(
        "nissekomm-tidsmaskin",
        JSON.stringify({ day, month: 12, hour: 12, minute: 0 }),
      );
    }, day);
    await page.reload();
    const pw = page.locator('input[placeholder="_ _ _"]');
    await pw.first().waitFor();
    const words = KID.split(" ");
    for (let i = 0; i < words.length; i++) await pw.nth(i).fill(words[i]);
    await pw.last().press("Enter");
    // Solve through today via Tidsmaskin, then skip intros
    await page.getByText("TIDSMASKIN", { exact: true }).click();
    await page.locator("select").first().selectOption(String(day));
    await page.getByRole("button", { name: /løst/i }).click();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2500);
    const tag = `d${day}-${w}x${h}`;
    // Today's Julius video opens on login
    const auto = page.getByRole("button", { name: "Lukk" }).first();
    if (await auto.isVisible().catch(() => false)) {
      await report(page, `${tag} DAGBOK(auto)`);
      await auto.click();
    }
    await report(page, `${tag} home`);
    for (const app of APPS) {
      const btn = page
        .getByRole("button", { name: new RegExp(`(^|\\s)${app}$`) })
        .first();
      if (!(await btn.isEnabled().catch(() => false))) continue;
      await btn.click({ timeout: 3000 }).catch(() => {});
      await report(page, `${tag} ${app}`);
      const close = page.getByRole("button", { name: "Lukk" }).first();
      if (await close.isVisible().catch(() => false)) await close.click();
      else await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
    // Parent guide
    await page.goto(`${BASE}/nissemor-guide`);
    const gp = page.locator("input").first();
    if (
      await gp.waitFor({ timeout: 5000 }).then(
        () => true,
        () => false,
      )
    ) {
      await gp.fill(PARENT);
      await page.getByRole("button", { name: "LOGG INN" }).click();
      await page
        .getByRole("button", { name: "LOGG INN" })
        .waitFor({ state: "detached", timeout: 10000 })
        .catch(() => console.log("guide login failed"));
    }
    for (const p of GUIDE) {
      await page.goto(`${BASE}/nissemor-guide${p}`);
      await report(page, `${tag} guide${p || "/"}`);
    }
    await ctx.close();
  }
}
await browser.close();
