#!/usr/bin/env node
// Automated playthrough of day 1..24 in a headless browser.
// Usage: node scripts/gjennomspilling.mjs   (or BASE_URL=http://localhost:3000, DAYS=10,21, WIDTH=1024 HEIGHT=768)
// Talks raw CDP to chrome-headless-shell (Playwright's cache) or $CHROME, so no new dependency.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SHOTS = join(ROOT, "test-results", "gjennomspilling");
// Login checks KID_CODE from the server's environment; with BASE_URL, pass the same one
const KID_CODE = process.env.KID_CODE ?? "NISSEKRAFT2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const missions = [1, 2, 3, 4]
  .flatMap((i) =>
    JSON.parse(
      readFileSync(join(ROOT, `src/data/uke${i}_oppdrag.json`), "utf8"),
    ),
  )
  .sort((a, b) => a.dag - b.dag);
// Short codes printed under the QR on each symbol card
const SHORT_CODES = Object.fromEntries(
  [
    ...readFileSync(
      join(ROOT, "src/lib/systems/symbol-system.ts"),
      "utf8",
    ).matchAll(/"([a-z]+-[a-z]+)": "([A-Z0-9]{4})"/g),
  ].map((m) => [m[1], m[2]]),
);
const FROST_DAYS = { 10: ".frost-vhs", 21: ".frost-edge:not(.frost-thaw)" };
const days = process.env.DAYS
  ? process.env.DAYS.split(",").map(Number)
  : missions.map((m) => m.dag);

function freePort() {
  return new Promise((res) => {
    const s = createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => res(port));
    });
  });
}

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  for (const base of [
    join(homedir(), "Library/Caches/ms-playwright"),
    join(homedir(), ".cache/ms-playwright"),
  ]) {
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base)
      .filter((d) => d.startsWith("chromium_headless_shell"))
      .sort()
      .reverse()) {
      for (const sub of readdirSync(join(base, d))) {
        const p = join(base, d, sub, "chrome-headless-shell");
        if (existsSync(p)) return p;
      }
    }
  }
  throw new Error(
    "Fant ingen chrome-headless-shell. Sett CHROME=/sti/til/chrome eller kjør `npx playwright install chromium-headless-shell`.",
  );
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
      process.kill(-c.pid, "SIGTERM"); // whole group, so next dev's workers die too
    } catch {}
  });
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));

let base = process.env.BASE_URL;
let log = "";
if (!base) {
  const port = await freePort();
  base = `http://localhost:${port}`;
  const startDev = async () => {
    const dev = spawn("pnpm", ["exec", "next", "dev", "-p", String(port)], {
      cwd: ROOT,
      env: {
        ...process.env,
        NEXT_PUBLIC_STORAGE_BACKEND: "localStorage",
        NEXT_PUBLIC_TEST_MODE: "true",
        NEXT_PUBLIC_BOOT_ANIMATION_DURATION: "0",
        NEXT_PUBLIC_MOCK_DAY: "",
        NEXT_PUBLIC_MOCK_MONTH: "",
        KID_CODE,
        NISSEKOMM_MODE: "lan",
      },
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });
    dev.stdout.on("data", (d) => (log += d));
    dev.stderr.on("data", (d) => (log += d));
    children.push(dev);
    console.log(`starter next dev på ${base} (pid ${dev.pid})`);
    await waitFor(async () => (await fetch(base)).ok, 120000, "next dev").catch(
      (e) => {
        console.error(log);
        throw e;
      },
    );
    return dev;
  };
  const dev = await startDev();
  await fetch(base + "/api/health").catch(() => {});
  // next 16.4 stops `next dev` once to show an upgrade nudge when it detects an AI agent
  // and lets the retry through; a human terminal never sees this.
  await sleep(10000);
  if (dev.exitCode !== null || dev.signalCode !== null) await startDev();
}

const cdpPort = await freePort();
const profile = mkdtempSync(join(tmpdir(), "gjennomspilling-"));
const chrome = spawn(
  findChrome(),
  [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile}`,
    "--window-size=1440,900",
    "--mute-audio",
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);
children.push(chrome);
process.on("exit", () => rmSync(profile, { recursive: true, force: true }));
let pageWs;
await waitFor(
  async () => {
    const list = await (
      await fetch(`http://127.0.0.1:${cdpPort}/json/list`)
    ).json();
    pageWs = list.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    return pageWs;
  },
  15000,
  "chrome",
);

const ws = new WebSocket(pageWs);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let nextId = 0;
const pending = new Map();
const errors = [];
ws.addEventListener("message", ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    return msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  }
  const p = msg.params;
  if (msg.method === "Runtime.exceptionThrown")
    errors.push(
      `pageerror: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`,
    );
  if (msg.method === "Runtime.consoleAPICalled" && p.type === "error")
    errors.push(
      `console.error: ${p.args.map((a) => a.value ?? a.description).join(" ")}`,
    );
  // A missing Julius video is a designed fallback («SIGNALET ER SVAKT»), not a failure
  if (
    msg.method === "Log.entryAdded" &&
    p.entry.level === "error" &&
    !p.entry.url?.includes("/media/")
  )
    errors.push(`log: ${p.entry.text} ${p.entry.url ?? ""}`);
});
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++nextId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
    );
  return r.result.value;
};
const text = () => evaluate("document.body.innerText");
const clickText = (label) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll('button, [role=button], div, span')]
      .find((e) => e.offsetParent !== null && e.innerText?.trim() === ${JSON.stringify(label)});
    if (!el) return false;
    (el.closest('button,[role=button]') ?? el).click();
    return true;
  })()`);
const typeInto = async (selector, value) => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  await send("Input.insertText", { text: value });
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    text: "\r",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
  });
};
const shot = async (name) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(SHOTS, name), Buffer.from(data, "base64"));
};
const frostgrad = () =>
  evaluate(
    `(() => { const t = document.body.innerText.match(/FROSTGRADEN\\s+(TØVÆR|\\d+ %)/); return t ? t[1] : null; })()`,
  );
const LOGIN = "input[aria-label='Ord 1 av 3']";
const closeWindow = async () => {
  if (
    await evaluate(
      `(() => { const b = document.querySelector('[aria-label=Lukk]'); b?.click(); return !!b })()`,
    )
  )
    await sleep(600);
};
const has = (sel) =>
  evaluate(`!!document.querySelector(${JSON.stringify(sel)})`);
const wordRe = (w) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu");

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(process.env.WIDTH ?? 1440),
  height: Number(process.env.HEIGHT ?? 900),
  deviceScaleFactor: 1,
  mobile: false,
});
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

// Fresh storage, then log in once; progress carries across days like a real December
await send("Page.navigate", { url: base });
await waitFor(
  () => evaluate("document.readyState === 'complete'"),
  30000,
  "første lasting",
);
// Simulering API (src/lib/simulation.ts), mounted with Tidsmaskin in lan mode
await waitFor(
  () => evaluate("!!window.nissekomm?.sim"),
  30000,
  "window.nissekomm.sim: dev server not ready / restart it (BASE_URL-serveren må kjøre i lan-modus med NEXT_PUBLIC_TEST_MODE=true; ellers stopp og start `mise run dev` på nytt, eller slett .next etter en Next-oppgradering)",
);
await evaluate("localStorage.clear()");

const results = [];
for (const day of days) {
  const m = missions.find((x) => x.dag === day);
  const fails = [];
  const check = (ok, msg) => ok || fails.push(msg);
  errors.length = 0;
  try {
    await evaluate(`window.nissekomm.sim.goTo(${day}, "08:00")`);
    await send("Page.navigate", { url: base });
    await waitFor(
      async () => /KODETERMINAL|VIDEODAGBOK|LOGG INN/.test(await text()),
      30000,
      "skrivebord eller innlogging",
    );
    if (await has(LOGIN)) {
      await typeInto(LOGIN, KID_CODE);
      await waitFor(async () => !(await has(LOGIN)), 15000, "innlogging");
    }
    await waitFor(
      async () => (await text()).includes("NY MELDING FRA JULIUS"),
      8000,
      "«NY MELDING FRA JULIUS» åpner ikke",
    ).catch((e) => fails.push(e.message));
    await sleep(800);
    const dagbokBefore = await text();
    await shot(`dag-${String(day).padStart(2, "0")}-for.png`);
    await closeWindow();
    const desktop = await text();

    const expected = missions
      .filter((x) => x.dag <= day)
      .flatMap((x) => x.reveals?.modules ?? []);
    for (const mod of expected)
      check(desktop.includes(mod), `modul ${mod} mangler`);
    for (const later of missions
      .filter((x) => x.dag > day)
      .flatMap((x) => x.reveals?.modules ?? []))
      check(!desktop.includes(later), `modul ${later} synlig for tidlig`);
    for (const x of missions.filter((x) => x.dag >= day)) {
      // Pure numbers (48, 24, 75) collide with dates and percentages; only words are checked
      // World names (komponentlekkasje.test.ts) appear in ordinary text by design
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
    if (FROST_DAYS[day])
      check(
        await has(FROST_DAYS[day]),
        `frost (${FROST_DAYS[day]}) mangler før løsning`,
      );
    else
      check(
        !(await has(".frost-vhs, .frost-edge")),
        "frost vises på en dag uten frost",
      );
    await shot(`dag-${String(day).padStart(2, "0")}-skrivebord.png`);

    check(await clickText("KODETERMINAL"), "fant ikke KODETERMINAL-ikonet");
    await waitFor(
      () => has("form input[type=text]"),
      5000,
      "KodeTerminal-input",
    );
    const input = await evaluate(
      `(() => { const i=[...document.querySelectorAll('form input[type=text]')].pop(); i.id='gj-kode'; return true })()`,
    );
    check(input, "ingen kodefelt");
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

    await closeWindow();
    // Headless Chrome has no camera: the scanner must fall back to the typed card code
    if (m.symbol_clue) {
      check(await clickText("SYMBOLSKANNER"), "fant ikke SYMBOLSKANNER");
      await waitFor(
        () => has("[data-kamera=mangler], [data-kamera=nektet]"),
        8000,
        "skanneren viser ikke reserve uten kamera",
      ).catch((e) => fails.push(e.message));
      await typeInto("#symbolkode", SHORT_CODES[m.symbol_clue.symbolId]);
      await waitFor(
        async () => (await text()).includes("NYTT SYMBOL!"),
        5000,
        `symbolkort ${m.symbol_clue.symbolId} ble ikke samlet med kortkode`,
      ).catch((e) => fails.push(e.message));
      check(!(await has("video")), "kamera-video ligger igjen i skanneren");
      await closeWindow();
      check(!(await has(".qr-host")), "skanneren lukket ikke kameraet");
    }
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
    if (FROST_DAYS[day]) {
      check(
        !(await has(FROST_DAYS[day])),
        "frosten forsvinner ikke etter løsning",
      );
    }
    await sleep(day === 21 ? 6000 : 4000); // let Frostgraden tick down
    const frostAfter = await frostgrad();
    if (frostBefore) {
      const n = (s) => (s === "TØVÆR" ? 0 : parseInt(s, 10));
      check(
        frostAfter && n(frostAfter) < n(frostBefore),
        `Frostgraden falt ikke (${frostBefore} → ${frostAfter})`,
      );
    } else check(day <= 6, `Frostgraden mangler dag ${day}`);
    await shot(`dag-${String(day).padStart(2, "0")}-etter.png`);
    for (const e of errors) fails.push(e.slice(0, 300));
    results.push({
      day,
      ok: fails.length === 0,
      fails,
      frost: `${frostBefore ?? "-"} → ${(await frostgrad()) ?? "-"}`,
    });
  } catch (e) {
    fails.push(e.message);
    await shot(`dag-${String(day).padStart(2, "0")}-feil.png`).catch(() => {});
    results.push({ day, ok: false, fails });
  }
  const r = results.at(-1);
  console.log(
    `${r.ok ? "OK  " : "FEIL"} dag ${String(day).padStart(2)} ${r.frost ?? ""}${r.fails.map((f) => `\n       - ${f}`).join("")}`,
  );
}

ws.close();
const failed = results.filter((r) => !r.ok).length;
console.log(
  `\n${results.length - failed}/${results.length} dager OK. Skjermbilder: ${SHOTS}`,
);
if (log) writeFileSync(join(SHOTS, "next-dev.log"), log);
process.exit(failed ? 1 : 0);
