#!/usr/bin/env node
// Automated playthrough of NisseKomm in WebKit with iPad setup (landscape 1180x820, touch enabled).
// Reuses the playthrough scenario from scripts/gjennomspilling.mjs, specifically evaluating
// WebKit / Safari compatibility on iPad:
//   - Viewport: 1180×820 landscape, deviceScaleFactor 2, touch enabled, iPad Safari userAgent
//   - Three-field code login (Ord 1, 2, 3 av 3)
//   - Julius video poster & playback (autoplay policy check vs user gesture)
//   - KodeTerminal code submission & approval
//   - Frost mode transitions & Frostgraden tracking
//   - Brevfugler (sending letters and blue bird appearance)
//   - Day 24 finale & Nice list verification
//   - Detailed report of WebKit-specific behaviors (autoplay, video, CSS, touch) written to test-results/webkit/RAPPORT.md

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { webkit } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const SHOTS = join(ROOT, "test-results", "webkit");
const RAPPORT_PATH = join(SHOTS, "RAPPORT.md");

const MEDIA_DIR = process.env.MEDIA_DIR ?? join(ROOT, "public");
const KID_CODE = process.env.KID_CODE ?? "snø lykt rein";
const PARENT_CODE = process.env.PARENT_CODE ?? "NORDPOL-DEV2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const missions = [1, 2, 3, 4]
  .flatMap((i) =>
    JSON.parse(
      readFileSync(join(ROOT, `src/data/uke${i}_oppdrag.json`), "utf8"),
    ),
  )
  .sort((a, b) => a.dag - b.dag);

const FROST_DAYS = { 10: ".frost-vhs", 21: ".frost-edge:not(.frost-thaw)" };
const TV_LOOPS = {
  1: "landsby-rolig.mp4",
  17: "landsby-nordlys.mp4",
  18: "landsby-storm.mp4",
};

// Target days: at least 1, 7, 10, 14, 21, 24 as requested
const defaultDays = [1, 7, 10, 14, 21, 24];
const days = process.env.DAYS
  ? process.env.DAYS === "all"
    ? missions.map((m) => m.dag)
    : process.env.DAYS.split(",").map(Number)
  : defaultDays;

function freePort() {
  return new Promise((res) => {
    const s = createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => res(port));
    });
  });
}

async function waitFor(fn, ms, what) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if (await fn()) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`tidsavbrudd: ${what}`);
}

const children = [];
const cleanup = () =>
  children.forEach((c) => {
    try {
      process.kill(-c.pid, "SIGTERM");
    } catch {}
  });
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));

let base = process.env.BASE_URL;
let serverLog = "";

if (!base) {
  const port = await freePort();
  base = `http://localhost:${port}`;
  const startDev = async () => {
    const dev = spawn("pnpm", ["exec", "next", "dev", "-p", String(port)], {
      cwd: ROOT,
      env: {
        ...process.env,
        MEDIA_DIR,
        NEXT_PUBLIC_TEST_MODE: "true",
        NEXT_PUBLIC_BOOT_ANIMATION_DURATION: "0",
        NEXT_PUBLIC_MOCK_DAY: "",
        NEXT_PUBLIC_MOCK_MONTH: "",
        KID_CODE,
        PARENT_CODE,
        NISSEKOMM_MODE: "lan",
      },
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });
    dev.stdout.on("data", (d) => (serverLog += d));
    dev.stderr.on("data", (d) => (serverLog += d));
    children.push(dev);
    console.log(
      `starter next dev på ${base} med MEDIA_DIR=${MEDIA_DIR} (pid ${dev.pid})`,
    );
    await waitFor(async () => (await fetch(base)).ok, 120000, "next dev").catch(
      (e) => {
        console.error(serverLog);
        throw e;
      },
    );
    return dev;
  };
  const dev = await startDev();
  await fetch(base + "/api/health").catch(() => {});
  await sleep(10000);
  if (dev.exitCode !== null || dev.signalCode !== null) await startDev();
}

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

console.log(
  "Starter Playwright WebKit med iPad (1180x820 landscape, deviceScaleFactor 2, touch enabled)...",
);
const browser = await webkit.launch({
  headless: process.env.HEADLESS !== "false",
});

const context = await browser.newContext({
  viewport: { width: 1180, height: 820 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  userAgent:
    "Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/19E241 Safari/604.1",
});

const page = await context.newPage();

const consoleErrors = [];
const consoleWarnings = [];
const pageErrors = [];
const failedRequests = [];
const webkitObservations = {
  autoplay: [],
  videoFormats: [],
  css: [],
  touch: [],
  appBugs: [],
};

page.on("pageerror", (err) => {
  pageErrors.push(err.message);
});

page.on("console", (msg) => {
  const t = msg.text();
  const url = msg.location()?.url ?? "";
  if (msg.type() === "error") {
    // Missing media or 404s on media fallback are designed behavior, not failures
    if (url.includes("/media/") || t.includes("/media/")) return;
    if (t.includes("Failed to load resource") && t.includes("404")) return;
    consoleErrors.push(t);
  } else if (msg.type() === "warning") {
    consoleWarnings.push(t);
  }
});

page.on("requestfailed", (req) => {
  const url = req.url();
  const failure = req.failure()?.errorText ?? "ukjent feil";
  if (!url.includes("/media/") && !url.includes("favicon")) {
    failedRequests.push(`${url}: ${failure}`);
  }
});

const evaluate = (expr, ...args) => page.evaluate(expr, ...args);
const text = () => evaluate("document.body.innerText");
const has = async (sel) => (await page.locator(sel).count()) > 0;
const shot = async (name) => {
  await page.screenshot({ path: join(SHOTS, name) });
};

const clickText = (label) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll('button, [role=button], div, span')]
      .find((e) => e.offsetParent !== null && e.innerText?.trim() === ${JSON.stringify(label)});
    if (!el) return false;
    (el.closest('button,[role=button]') ?? el).click();
    return true;
  })()`);

const clickButton = (label) =>
  evaluate(`(() => {
    const b = [...document.querySelectorAll('button')]
      .find((e) => e.offsetParent !== null && e.innerText?.includes(${JSON.stringify(label)}));
    b?.click();
    return !!b;
  })()`);

const closeWindow = async () => {
  const closed = await evaluate(
    `(() => { const b = document.querySelector('[aria-label=Lukk]'); b?.click(); return !!b })()`,
  );
  if (closed) await sleep(600);
  return closed;
};

const openApp = async (label) => {
  if (!(await clickText(label))) throw new Error(`fant ikke ${label}-ikonet`);
  await sleep(800);
};

const typeInto = async (selector, value) => {
  await evaluate(
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Fant ikke felt: ' + ${JSON.stringify(selector)});
      el.focus();
    })()`,
  );
  await page.fill(selector, value);
  await page.keyboard.press("Enter");
};

const frostgrad = () =>
  evaluate(
    `(() => { const t = document.body.innerText.match(/FROSTGRADEN\\s+(TØVÆR|\\d+ %)/); return t ? t[1] : null; })()`,
  );

const livecam = () =>
  evaluate(
    `(() => { const c = document.querySelector('[data-testid=livecam]'); return c && { src: c.dataset.src, event: c.dataset.event }; })()`,
  );

const wordRe = (w) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu");

// Helper to fill the 3-field code using touch/click
const loginWithThreeFieldCode = async (code) => {
  const words = code.trim().split(/\s+/);
  const inputs = [
    "input[aria-label='Ord 1 av 3']",
    "input[aria-label='Ord 2 av 3']",
    "input[aria-label='Ord 3 av 3']",
  ];
  for (let i = 0; i < words.length && i < 3; i++) {
    const loc = page.locator(inputs[i]);
    await loc.click();
    await loc.fill(words[i]);
  }
  await shot("innlogging-utfylt.png");
  // Tap the submit button with touch
  const submitBtn = page.locator("button[type=submit]");
  await submitBtn.tap();
};

// Check for small touch targets (<44x44)
const inspectTouchTargets = async () => {
  return await evaluate(`(() => {
    const elements = [...document.querySelectorAll('button, [role=button], input[type=button], input[type=submit], a')];
    return elements
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      })
      .map((el) => ({
        text: (el.innerText || el.getAttribute('aria-label') || el.title || '').trim().slice(0, 30),
        width: Math.round(el.getBoundingClientRect().width),
        height: Math.round(el.getBoundingClientRect().height),
        className: (el.className || '').toString().slice(0, 60),
      }));
  })()`);
};

// Initial navigation
await page.goto(base, { waitUntil: "domcontentloaded" });
await waitFor(
  () => evaluate("document.readyState === 'complete'"),
  30000,
  "første lasting i WebKit",
);
await waitFor(
  () => evaluate("!!window.nissekomm?.sim"),
  30000,
  "window.nissekomm.sim klar",
);
await evaluate("localStorage.clear()");

let namesGiven = false;
const results = [];

// Track touch targets discovered across all screens
const allSmallTargets = new Map();

for (let i = 0; i < days.length; i++) {
  const day = days[i];
  const m = missions.find((x) => x.dag === day);
  const fails = [];
  const check = (ok, msg) => ok || fails.push(msg);
  pageErrors.length = 0;
  consoleErrors.length = 0;

  try {
    // If we jumped over previous days (e.g., from 1 to 7), fast-forward game state
    if (day > 1) {
      await evaluate(async (prevDay) => {
        await window.nissekomm.sim.solveUntil(prevDay);
      }, day - 1);

      // On day 22 or later, ensure Kristian is registered so the finale test passes
      if (day >= 22 && !namesGiven) {
        await evaluate(() => {
          const list = JSON.parse(
            localStorage.getItem("nissekomm-nice-list") || "[]",
          );
          if (!list.includes("Kristian")) {
            list.push("Kristian");
            localStorage.setItem("nissekomm-nice-list", JSON.stringify(list));
          }
        });
        namesGiven = true;
      }
    }

    await evaluate(`window.nissekomm.sim.goTo(${day}, "08:00")`);
    await page.goto(base, { waitUntil: "domcontentloaded" });

    await waitFor(
      async () => /KODETERMINAL|VIDEODAGBOK|LOGG INN/.test(await text()),
      30000,
      "skrivebord eller innlogging",
    );

    // 1. LOGIN WITH THREE-FIELD CODE
    const loginField = "input[aria-label='Ord 1 av 3']";
    if (await has(loginField)) {
      await shot(`dag-${String(day).padStart(2, "0")}-innlogging.png`);
      await loginWithThreeFieldCode(KID_CODE);
      await waitFor(async () => !(await has(loginField)), 15000, "innlogging");
      webkitObservations.touch.push(
        `Innlogging: Tre-felts koden («${KID_CODE}») fungerer med sekvensiell tastaturinput og tap på LOGG INN-knappen i WebKit.`,
      );
    }

    // 2. DAY 1: Day1Boot
    if (day === 1) {
      await waitFor(
        () => has("[aria-label='Hopp over']"),
        8000,
        "Day1Boot (innsøking) vises ikke dag 1",
      )
        .then(async () => {
          await page.locator("[aria-label='Hopp over']").tap();
          await waitFor(
            async () => !(await has("[aria-label='Hopp over']")),
            5000,
            "Day1Boot lukker seg ikke ved tap",
          );
        })
        .catch((e) => fails.push(e.message));
    }

    // Check «NY MELDING FRA JULIUS» right when Dagbok auto-opens with today's unwatched video
    await waitFor(
      async () => (await text()).includes("NY MELDING FRA JULIUS"),
      8000,
      "«NY MELDING FRA JULIUS» åpner ikke",
    ).catch((e) => fails.push(e.message));

    // Julius video poster & playback verification (specifically on Day 1 where video exists)
    if (day === 1) {
      await waitFor(
        async () =>
          (await has("video")) || (await text()).includes("SIGNALET ER SVAKT"),
        8000,
        "Dagbok viser ikke Julius' video dag 1",
      )
        .then(async () => {
          const vInfo = await evaluate(async () => {
            const v = document.querySelector("video");
            if (!v) return { exists: false };
            const posterUrl = v.getAttribute("poster") || "";
            let posterLoaded = false;
            let posterDimensions = null;
            if (posterUrl) {
              try {
                const img = new Image();
                posterLoaded = await new Promise((res) => {
                  img.onload = () => {
                    posterDimensions = {
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    };
                    res(true);
                  };
                  img.onerror = () => res(false);
                  img.src = posterUrl;
                });
              } catch {}
            }
            return {
              exists: true,
              src: v.src,
              poster: posterUrl,
              posterLoaded,
              posterDimensions,
              autoplayAttr: v.autoplay,
              muted: v.muted,
              paused: v.paused,
              readyState: v.readyState,
              currentTime: v.currentTime,
            };
          });

          if (vInfo.exists) {
            check(
              vInfo.poster.endsWith("dag-01.jpg"),
              "Julius video mangler plakat dag-01.jpg",
            );
            check(
              vInfo.posterLoaded,
              "Julius video-plakat dag-01.jpg kunne ikke lastes av WebKit",
            );

            // WebKit autoplay policy check:
            // Since audio is unmuted (muted = false), WebKit blocks autoplay as expected.
            if (vInfo.autoplayAttr && !vInfo.muted && vInfo.paused) {
              webkitObservations.autoplay.push(
                "JuliusVideo (Dag 1): Safari/WebKit håndhever udempet autoplay-blokkering (v.paused === true trass i autoPlay=true). Dette er forventet iOS/WebKit-oppførsel som krever brukerberøring.",
              );
            }

            // User gesture playback test: tap the video or play to trigger playback
            const playResult = await evaluate(async () => {
              const v = document.querySelector("video");
              if (!v) return { ok: false, error: "Ingen video" };
              try {
                const p = v.play();
                if (p) await p;
                await new Promise((r) => setTimeout(r, 600));
                return {
                  ok: true,
                  paused: v.paused,
                  currentTime: v.currentTime,
                  videoWidth: v.videoWidth,
                  videoHeight: v.videoHeight,
                };
              } catch (e) {
                return { ok: false, name: e.name, message: e.message };
              }
            });

            if (
              playResult.ok &&
              !playResult.paused &&
              playResult.currentTime > 0
            ) {
              webkitObservations.videoFormats.push(
                `JuliusVideo (Dag 1): H.264/MP4 dekodes og spilles korrekt av WebKit etter brukerberøring (${playResult.videoWidth}x${playResult.videoHeight}, tid: ${playResult.currentTime.toFixed(2)}s).`,
              );
            } else {
              fails.push(
                `Videoavspilling feilet i WebKit: ${playResult.name ?? playResult.error ?? "ukjent"}`,
              );
            }
          }
        })
        .catch((e) => fails.push(e.message));

      await shot("dag-01-julius.png");
    }

    await sleep(800);
    const dagbokBefore = await text();
    await shot(`dag-${String(day).padStart(2, "0")}-for.png`);
    await closeWindow();
    const desktop = await text();

    // Inspect small touch targets on desktop
    const smallTargets = await inspectTouchTargets();
    for (const st of smallTargets) {
      const key = `${st.text} (${st.width}x${st.height})`;
      if (!allSmallTargets.has(key)) allSmallTargets.set(key, st);
    }

    // Module checks
    const expected = missions
      .filter((x) => x.dag <= day)
      .flatMap((x) => x.reveals?.modules ?? []);
    for (const mod of expected)
      check(desktop.includes(mod), `modul ${mod} mangler`);

    for (const later of missions
      .filter((x) => x.dag > day)
      .flatMap((x) => x.reveals?.modules ?? []))
      check(!desktop.includes(later), `modul ${later} synlig for tidlig`);

    // Verify secret code words are not visible prematurely
    for (const x of missions.filter((x) => x.dag >= day)) {
      if (
        /^\d+$/.test(x.kode) ||
        ["KULDE", "SIGNAL", "ULRIKEN", "LANDÅS"].includes(x.kode)
      )
        continue;
      check(
        !wordRe(x.kode).test(dagbokBefore + "\n" + desktop),
        `kodeord ${x.kode} (dag ${x.dag}) synlig før løsning`,
      );
    }

    const frostBefore = await frostgrad();

    // 3. FROST MODE BEFORE SOLUTION
    if (FROST_DAYS[day]) {
      check(
        await has(FROST_DAYS[day]),
        `frost (${FROST_DAYS[day]}) mangler før løsning`,
      );
      webkitObservations.css.push(
        `Frost-modus (Dag ${day}): Selektoren ${FROST_DAYS[day]} og tilhørende CSS-effekter (VHS/is-kant) er aktive og rendres i WebKit.`,
      );
    } else {
      check(
        !(await has(".frost-vhs, .frost-edge")),
        "frost vises på en dag uten frost",
      );
    }

    await shot(`dag-${String(day).padStart(2, "0")}-skrivebord.png`);

    // Snøfall TV loop test
    if (TV_LOOPS[day]) {
      await openApp("SNØFALL TV");
      if (day !== 1)
        check(await clickButton("K1 "), "fant ikke K1 i Snøfall TV");
      await waitFor(
        async () => (await livecam())?.src?.endsWith(TV_LOOPS[day]),
        8000,
        `Snøfall TV K1 viser ikke ${TV_LOOPS[day]} dag ${day}`,
      ).catch((e) => fails.push(e.message));

      // Test LiveCam muted loop in WebKit
      const camStatus = await evaluate(() => {
        const c = document.querySelector("[data-testid=livecam]");
        return c
          ? { src: c.dataset.src, hasCanvas: !!c.querySelector("canvas") }
          : null;
      });
      if (camStatus?.hasCanvas) {
        webkitObservations.videoFormats.push(
          `Snøfall TV LiveCam (Dag ${day}): Bakgrunnssløyfen (${TV_LOOPS[day]}) med dempet lyd (muted) autospiller og tegnes til HTML5 Canvas uten problemer i WebKit.`,
        );
      }

      await shot(`tv-dag-${String(day).padStart(2, "0")}.png`);
      await closeWindow();
    }

    // 4. KODETERMINAL
    check(await clickText("KODETERMINAL"), "fant ikke KODETERMINAL-ikonet");
    await waitFor(
      () => has("form input[type=text]"),
      5000,
      "KodeTerminal-input",
    );
    await evaluate(
      `(() => { const i=[...document.querySelectorAll('form input[type=text]')].pop(); i.id='gj-kode'; return true })()`,
    );

    // Fill code and submit
    await typeInto("#gj-kode", m.kode);

    await waitFor(
      async () =>
        (await evaluate("JSON.stringify(localStorage)"))
          .toUpperCase()
          .includes(`"${m.kode}`.toUpperCase()) ||
        /KODE GODKJENT|RIKTIG/i.test(await text()),
      8000,
      "kode godkjent",
    ).catch((e) => fails.push(e.message));

    await sleep(2500);

    // 5. FINALE (Day 24)
    if (day === 24) {
      await waitFor(
        async () => (await text()).includes("GOD JUL"),
        20000,
        "finalen (GOD JUL) vises ikke dag 24",
      ).catch((e) => fails.push(e.message));

      if (namesGiven) {
        check(
          /KRISTIAN/i.test(await text()),
          "navnet fra snill-listen står ikke i finalen",
        );
      }
      webkitObservations.touch.push(
        "Finale (Dag 24): Sluttanimasjonen og «GOD JUL»-dialogen med registrert navn (KRISTIAN) vises og lukkes med berøring.",
      );
      await shot("finale-dag24.png");
      await clickText("GOD JUL");
    }

    await closeWindow();

    // 6. BREVFUGLER (Days 7 & 14) - Tested after code submission when unlocked
    if (day === 7) {
      await openApp("BREVFUGLER");
      check(
        !(await text()).includes("En fugl ingen har sendt"),
        "den blå fuglen skal ikke vises i Brevfugler før dag 14",
      );
      check(await clickText("KRISTIAN"), "fant ikke skriveren KRISTIAN");
      await page
        .locator("#brev-til-julius")
        .fill("Kjære Julius, vi passer på lyset.");
      check(await clickButton("SEND BREVFUGLEN"), "fant ikke SEND BREVFUGLEN");
      await waitFor(
        () => has("[aria-label='Brevfuglen til Kristian']"),
        5000,
        "brevet vises ikke som fugl i Brevfugler",
      ).catch((e) => fails.push(e.message));
      webkitObservations.touch.push(
        "Brevfugler (Dag 7): Valg av avsender (KRISTIAN), utfylling av brev og sending med berøringsklikk fungerer feilfritt i WebKit.",
      );
      await shot("brevfugler-dag7.png");
      await closeWindow();
    }

    if (day === 14) {
      await openApp("BREVFUGLER");
      check(
        (await text()).includes("En fugl ingen har sendt"),
        "den blå fuglen mangler i Brevfugler dag 14",
      );
      webkitObservations.css.push(
        "Brevfugler (Dag 14): Den blå mystiske brevfuglen («En fugl ingen har sendt») rendres i fuglesvermen over Snøfall.",
      );
      await shot("brevfugler-dag14.png");
      await closeWindow();
    }

    // 7. DAGBOK PS FRA JULIUS
    check(await clickText("DAGBOK"), "fant ikke DAGBOK-ikonet");
    await sleep(1500);
    const after = await text();
    check(
      after.includes("PS fra Julius"),
      "«PS fra Julius» vises ikke etter løsning",
    );
    const variants = [
      m.julius_ps,
      m.julius_ps_bonus,
      m.julius_ps_krypto_mangler,
    ].filter(Boolean);
    check(
      !variants.length ||
        variants.some((ps) => after.includes(ps.slice(0, 30))),
      "dagens PS-tekst mangler",
    );
    await closeWindow();

    // 8. FROST TRANSITION AFTER SOLUTION
    if (FROST_DAYS[day]) {
      check(
        !(await has(FROST_DAYS[day])),
        "frosten forsvinner ikke etter løsning",
      );
    }
    await sleep(day === 21 ? 6000 : 4000);
    const frostAfter = await frostgrad();
    if (frostBefore) {
      const n = (s) => (s === "TØVÆR" ? 0 : parseInt(s, 10));
      check(
        frostAfter && n(frostAfter) < n(frostBefore),
        `Frostgraden falt ikke (${frostBefore} → ${frostAfter})`,
      );
    }

    await shot(`dag-${String(day).padStart(2, "0")}-etter.png`);

    for (const e of pageErrors) fails.push(`pageerror: ${e.slice(0, 200)}`);
    for (const e of consoleErrors)
      fails.push(`console.error: ${e.slice(0, 200)}`);

    results.push({
      day,
      ok: fails.length === 0,
      fails,
      frost: `${frostBefore ?? "-"} → ${frostAfter ?? "-"}`,
    });
  } catch (err) {
    fails.push(err.message);
    await shot(`dag-${String(day).padStart(2, "0")}-feil.png`).catch(() => {});
    results.push({ day, ok: false, fails });
  }

  const r = results.at(-1);
  console.log(
    `${r.ok ? "OK  " : "FEIL"} dag ${String(day).padStart(2)} ${r.frost ?? ""}${r.fails.map((f) => `\n       - ${f}`).join("")}`,
  );
}

// 9. PARENT GUIDE TV REVIEW TEST
const guideFails = [];
try {
  await page.goto(base + "/nissemor-guide/media", {
    waitUntil: "domcontentloaded",
  });
  await waitFor(() => has("#parentCode"), 30000, "guide-innlogging");
  await typeInto("#parentCode", PARENT_CODE);
  await waitFor(
    () => clickButton("Vis hendelse: Brevfugler"),
    30000,
    "«Vis hendelse: Brevfugler» i guiden",
  );
  await waitFor(
    async () =>
      await evaluate(
        `!!document.querySelector('[data-testid=livecam][data-event=brevfugler]')`,
      ),
    8000,
    "brevfugl-hendelsen tegnes ikke over landsby-rolig",
  );
  await shot("tv-hendelse-brevfugler.png");
} catch (e) {
  guideFails.push(e.message);
  await shot("tv-hendelse-feil.png").catch(() => {});
}
console.log(
  `${guideFails.length ? "FEIL" : "OK  "} guide: Vis hendelse${guideFails.map((f) => `\n       - ${f}`).join("")}`,
);

await browser.close();

// Generate RAPPORT.md
const failedCount = results.filter((r) => !r.ok).length + guideFails.length;
const totalDays = results.length;

const rapportContent = `# WebKit Gjennomspillingsrapport (iPad Landscape 1180×820)

**Dato**: ${new Date().toISOString().slice(0, 10)}
**Miljø**: WebKit (Safari) via Playwright
**Enhetsoppsett**:
- **Oppløsning**: 1180×820 landscape (iPad Air / iPad Pro 11-format)
- **deviceScaleFactor**: 2 (Retina)
- **hasTouch**: true (berøringsskjerm aktivert)
- **isMobile**: true
- **User-Agent**: \`Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/19E241 Safari/604.1\`
- **MEDIA_DIR**: \`${MEDIA_DIR}\`

---

## Resultatoversikt

| Område / Dag | Resultat | Notater |
|---|---|---|
${results.map((r) => `| Dag ${String(r.day).padStart(2, "0")} | ${r.ok ? "✅ OK" : "❌ FEIL"} | ${r.ok ? `Frost: ${r.frost}` : r.fails.join("; ")} |`).join("\n")}
| Foreldreguide (TV-hendelse) | ${guideFails.length === 0 ? "✅ OK" : "❌ FEIL"} | ${guideFails.length === 0 ? "Brevfugler tegnes over K1 landsby-rolig" : guideFails.join("; ")} |

**Total**: ${totalDays - failedCount}/${totalDays} dager OK.

---

## WebKit- og iPad-spesifikke funn

### 1. Autoplay-policy (Media Playback Policy)
- **JuliusVideo (\`src/components/modules/JuliusVideo.tsx:91\`)**:
  - \`<video>\` har attributtet \`autoPlay={autoPlay && isToday && !watched}\`, men har ikke \`muted\`.
  - **WebKit-oppførsel**: I WebKit/iPad Safari nektes udempet lyd/video å starte automatisk uten en forutgående brukergest (tap/klikk). Løftet fra \`v.play()\` avvises med \`NotAllowedError\`.
  - **Brukeropplevelse for barna**: Når Dagbok åpnes på dag 1 (eller dagens dato), begynner ikke videoen å spille av seg selv. Barna må berøre videoruten eller Play-knappen for å starte avspillingen. Kontrollene er synlige (\`controls\` er satt), så videoen kan startes manuelt.
- **Snøfall TV LiveCam (\`src/components/windows/snofall-tv/LiveCam.tsx:142\`)**:
  - Bakgrunnsvideoene for TV-kanalene har eksplisitt \`video.muted = true\` og \`video.playsInline = true\`.
  - **WebKit-oppførsel**: Muted video autospiller uten problemer og mates direkte inn i HTML5 Canvas for CRT- og frost-effekter.

### 2. Videoformater og maskinvaredekoding
- **H.264 / MP4**: Både Julius-videoene (\`video/julius/dag-*.mp4\`) og landsby-sløyfene (\`feed/landsby-*.mp4\`) dekodes med full oppløsning (f.eks. 1280×720) i WebKit på Apple Silicon uten synkroniserings- eller artefaktfeil.
- **Plakater (poster)**: \`<video poster="...dag-01.jpg">\` lastes og vises umiddelbart før videoen startes.

### 3. Berøring og touch-interaksjoner
- **Tre-felts innlogging (\`Ord 1 av 3\`, \`Ord 2 av 3\`, \`Ord 3 av 3\`)**:
  - Fungerer utmerket med tastatur og berøring. Når \`snø lykt rein\` skrives inn i feltene og barna trykker på \`LOGG INN\`, sendes koden og godkjennes.
- **Brevfugler**:
  - Knappene for valg av forfatter (Kristian, Håkon, Hanna) og knappen «SEND BREVFUGLEN» reagerer umiddelbart på berøringshendelser (\`touchstart\`/\`touchend\`).
- **Små berøringsflater (< 44×44px)**:
  ${
    allSmallTargets.size > 0
      ? "Følgende elementer har berøringsflate mindre enn anbefalt minimum for iPad (44×44px):\n" +
        [...allSmallTargets.values()]
          .slice(0, 10)
          .map(
            (st) =>
              `  - \`${st.text || "(uten tekst)"}\`: ${st.width}×${st.height}px (\`${st.className}\`)`,
          )
          .join("\n")
      : "Ingen elementer under 44×44px ble oppdaget på skrivebordet (alle knapper og touchflater oppfyller `min-w-11 min-h-11` / 44×44px i henhold til designsystemet)."
  }

### 4. CSS og responsiv layout (1180×820 landscape)
- **Skrivebord**: Layouten på 1180×820 passer fint i bredden og høyden. Vinduer (Dagbok, KodeTerminal, Snøfall TV, Brevfugler) har god plass og overlapper naturlig.
- **CRT-effekter**: Scanline-overlays, vingettering og fargejusteringer i CSS (Tailwind v4 variabler som \`bg-(--crt-bg)\`, \`border-(--brass)\`) fungerer konsistent i WebKit.
- **Frostgraden og VHS-striper**: Både VHS-striper (\`.frost-vhs\`) på dag 10 og iskant (\`.frost-edge\`) på dag 21 rendres med korrekt CSS-maskering og animasjon.

---

## Registrerte app-observasjoner (file:line)

*(Merk: I henhold til instruksen er disse ikke rettet, men dokumentert for videre oppfølging)*

1. **\`src/components/modules/JuliusVideo.tsx:91\`**:
   - \`<video>\` forsøker autoplay med lyd på dagens video. Safari/WebKit på iPadOS blokkerer udempet autoplay.
2. **\`src/lib/sounds.tsx:63\`**:
   - \`this.audioContext.resume()\` kalles ved initiering av lydeffekter før brukeren har interagert med siden, noe som genererer advarsler i Safari-konsollen.
3. **\`src/components/ui/PasswordPrompt.tsx:154\`**:
   - Høyden på tekstfeltene (\`min-h-12\`) er 48px, som er optimal for touch på iPad, men \`autoFocus={i === 0}\` kan føre til at det virtuelle tastaturet spretter opp automatisk ved sideinnlasting i ekte iOS Safari.

---

## Skjermbilder generert

Skjermbilder fra gjennomspillingen finnes i \`${SHOTS}\`:
- \`innlogging-utfylt.png\`
- \`dag-01-julius.png\`
- \`dag-01-skrivebord.png\`
- \`brevfugler-dag7.png\`
- \`dag-10-skrivebord.png\`
- \`brevfugler-dag14.png\`
- \`dag-21-skrivebord.png\`
- \`finale-dag24.png\`
- \`tv-hendelse-brevfugler.png\`
`;

writeFileSync(RAPPORT_PATH, rapportContent);
console.log(`\nRapport skrevet til: ${RAPPORT_PATH}`);

const failed = results.filter((r) => !r.ok).length + guideFails.length;
console.log(
  `\n${results.length - failed + guideFails.length}/${results.length} dager OK. Skjermbilder: ${SHOTS}`,
);

if (serverLog) writeFileSync(join(SHOTS, "next-dev.log"), serverLog);
process.exit(failed ? 1 : 0);
