// Two screens against one server: letters, seen marks, badges and the parents'
// ticks written at the same time must all survive the sync.
// Usage: BASE_URL=http://localhost:3010 KID_CODE="snø lykt rein" node scripts/to-skjermer.mjs
// The server must run in lan mode with NEXT_PUBLIC_TEST_MODE=true (window.nissekomm).
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const KID_CODE = process.env.KID_CODE ?? "snø lykt rein";
const fails = [];
// Unique names per run, so the script can run again against the same store.
const run = Date.now().toString(36);
const K = `Kristian-${run}`;
const H = `Håkon-${run}`;
const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FEIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const browser = await chromium.launch();
const screen = async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base);
  await page.evaluate(
    (code) =>
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }),
    KID_CODE,
  );
  await page.goto(base);
  await page.waitForFunction(() => !!window.nissekomm?.GameEngine, null, {
    timeout: 60000,
  });
  // The app syncs once it knows it is logged in (the login form sets this).
  await page.evaluate(() =>
    window.nissekomm.StorageManager.setAuthenticated(true),
  );
  await page.reload();
  await page.waitForFunction(() => !!window.nissekomm?.GameEngine);
  await page.waitForTimeout(1500);
  return page;
};
const server = (p) =>
  p.evaluate(() => fetch("/api/state").then((r) => r.json()));
// Debounce is 300 ms; a reload pulls the server's state.
const settle = (p) => p.waitForTimeout(1500);
const reload = async (p) => {
  await p.reload();
  await p.waitForFunction(() => !!window.nissekomm?.GameEngine);
  await p.waitForTimeout(1000);
};

const a = await screen();
const b = await screen();
await a.evaluate(() => window.nissekomm.sim.goTo(21, "20:00"));
await reload(a);
await reload(b);

// Letters: Håkon writes on b, Kristian edits his on a without pulling first.
await a.evaluate(
  (k) => window.nissekomm.GameEngine.addSantaLetter(3, "Kjære Jlius", k),
  K,
);
await settle(a);
await b.evaluate(
  (h) => window.nissekomm.GameEngine.addSantaLetter(3, "Hei Julius", h),
  H,
);
await settle(b);
await a.evaluate(
  (k) =>
    window.nissekomm.GameEngine.saveSantaLetters([
      ...window.nissekomm.GameEngine.getSantaLetters().filter(
        (l) => l.from !== k,
      ),
      { day: 3, content: "Kjære Julius", from: k },
    ]),
  K,
);
await settle(a);
const brev = ((await server(a))["nissekomm-santa-letters"] ?? []).filter(
  (x) => x.from === K || x.from === H,
);
check(
  brev.length === 2 && brev.some((x) => x.content === "Kjære Julius"),
  `brev: begge brevene, det rettede med (${JSON.stringify(brev)})`,
);

// Seen marks from both screens at once.
await Promise.all([
  a.evaluate((r) => window.nissekomm.GameEngine.markIntroSeen(`a-${r}`), run),
  b.evaluate((r) => window.nissekomm.GameEngine.markIntroSeen(`b-${r}`), run),
]);
await Promise.all([settle(a), settle(b)]);
const sett = (await server(a))["nissekomm-intros-seen"] ?? [];
check(
  sett.includes(`a-${run}`) && sett.includes(`b-${run}`),
  `sett-merker: begge skjermenes merker (${JSON.stringify(sett)})`,
);

// Parents tick on two phones at the same time.
await Promise.all([
  a.evaluate(
    (r) => window.nissekomm.StorageManager.setHandlet(`melk-${r}`, "kjopt"),
    run,
  ),
  b.evaluate(
    (r) => window.nissekomm.StorageManager.setHandlet(`lim-${r}`, "hjemme"),
    run,
  ),
  a.evaluate(
    (r) =>
      window.nissekomm.StorageManager.setForeldreAvkrysning(`kveld-${r}`, [
        "a",
      ]),
    run,
  ),
  b.evaluate(
    (r) =>
      window.nissekomm.StorageManager.setForeldreAvkrysning(`kveld-${r}`, [
        "b",
      ]),
    run,
  ),
]);
await Promise.all([settle(a), settle(b)]);
const st = await server(a);
check(
  st["nissekomm-handlet"]?.[`melk-${run}`] === "kjopt" &&
    st["nissekomm-handlet"]?.[`lim-${run}`] === "hjemme",
  `handleliste: begge krysset (${JSON.stringify(st["nissekomm-handlet"])})`,
);
const kv = st["nissekomm-foreldre-avkrysning"]?.[`kveld-${run}`] ?? [];
check(
  kv.includes("a") && kv.includes("b"),
  `avkrysning: begge kryssene (${JSON.stringify(kv)})`,
);

// Badge: day 21 solved on a; b shows the badge once after its pull.
await a.evaluate(() => window.nissekomm.sim.solveUntil(21, { symbols: true }));
await settle(a);
await reload(b);
const harB = await b.evaluate(() =>
  window.nissekomm.StorageManager.getEarnedBadges().map((x) => x.badgeId),
);
// The badge row shows on the desktop: close an open window (Dagbok) first.
const lukk = async (p) => {
  for (const x of await p.getByLabel("Lukk").all())
    await x.click().catch(() => {});
  await p.waitForTimeout(500);
};
await lukk(a);
await lukk(b);
const settB = await b.evaluate(() =>
  window.nissekomm.StorageManager.getBadgesSeen(),
);
const settA = await a.evaluate(() =>
  window.nissekomm.StorageManager.getBadgesSeen(),
);
check(harB.includes("portvokter"), `merke på b (${harB})`);
check(
  settA.includes("portvokter") && settB.includes("portvokter"),
  `merkevarsel vist på begge skjermer (a: ${settA}, b: ${settB})`,
);
await reload(b);
const settB2 = await b.evaluate(() =>
  window.nissekomm.StorageManager.getBadgesSeen(),
);
check(
  settB2.filter((x) => x === "portvokter").length === 1,
  "merkevarsel bare én gang per skjerm",
);

await browser.close();
console.log(fails.length ? `${fails.length} feil` : "alt ok");
process.exit(fails.length ? 1 : 0);
