// Dead session and 5xx at startup: the login comes back, the sync recovers.
// Usage: BASE_URL=http://localhost:3010 KID_CODE="snø lykt rein" node scripts/synk-sjekk.mjs
// The server must run with NEXT_PUBLIC_TEST_MODE=true (window.nissekomm).
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const KID_CODE = process.env.KID_CODE ?? "snø lykt rein";
const LOGIN = "input[aria-label='Ord 1 av 3']";
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FEIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
const visible = (page, sel, timeout = 20000) =>
  page.waitForSelector(sel, { timeout }).then(
    () => true,
    () => false,
  );

const browser = await chromium.launch();
const loggedIn = async (ctx) => {
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForFunction(() => !!window.nissekomm?.GameEngine, null, {
    timeout: 60000,
  });
  await page.evaluate(async (code) => {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    localStorage.setItem("nissekomm-kid-code", code);
    window.nissekomm.StorageManager.setAuthenticated(true);
  }, KID_CODE);
  return page;
};

// 1. Session cookie gone: the login shows again, the cache stays.
{
  const ctx = await browser.newContext();
  const page = await loggedIn(ctx);
  await page.reload();
  await page.waitForTimeout(3000);
  check(!(await page.$(LOGIN)), "innlogget: skrivebordet, ikke innloggingen");
  await ctx.clearCookies();
  await page.reload();
  check(await visible(page, LOGIN), "uten cookie: innloggingen vises");
  await ctx.close();
}

// 2. 503 at startup: the indicator shows, then the sync recovers.
{
  const ctx = await browser.newContext();
  const page = await loggedIn(ctx);
  let nede = true;
  await page.route("**/api/state", (r) =>
    nede && r.request().method() === "GET"
      ? r.fulfill({ status: 503, body: "nede" })
      : r.continue(),
  );
  await page.reload();
  check(
    await visible(page, "text=Frakoblet – prøver igjen"),
    "503 ved oppstart: «Frakoblet – prøver igjen» vises",
  );
  nede = false;
  const ok = await page
    .waitForSelector("text=Frakoblet – prøver igjen", {
      state: "detached",
      timeout: 20000,
    })
    .then(
      () => true,
      () => false,
    );
  check(ok, "serveren svarer igjen: synken tar seg opp uten omlasting");
  await ctx.close();
}

await browser.close();
if (fails.length) process.exit(1);
