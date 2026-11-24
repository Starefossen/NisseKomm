#!/usr/bin/env node
// Checks in a real browser that the enforced CSP (src/proxy.ts) blocks nothing in a production build.
// Usage: node scripts/csp-sjekk.mjs   (BYGG=0 reuses .next, BASE_URL=http://localhost:PORT uses a running server)
// Raw CDP to chrome-headless-shell like gjennomspilling.mjs, so no new dependency.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const KID_CODE = process.env.KID_CODE ?? "NISSEKRAFT2026";
const PARENT_CODE = process.env.PARENT_CODE ?? "NORDPOL-DEV2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const env = {
  ...process.env,
  NODE_ENV: "production",
  NISSEKOMM_MODE: "lan",
  NEXT_PUBLIC_TEST_MODE: "true",
  NEXT_PUBLIC_BOOT_ANIMATION_DURATION: "0",
  NEXT_PUBLIC_MOCK_DAY: "",
  NEXT_PUBLIC_MOCK_MONTH: "",
  KID_CODE,
  PARENT_CODE,
  // Own in-memory store, never mise dev's Postgres or file store
  DATABASE_URL: "",
  DEV_STORE_FILE: "",
};

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
process.on("exit", () =>
  children.forEach((c) => {
    try {
      process.kill(-c.pid, "SIGTERM"); // whole group, so next's workers die too
    } catch {}
  }),
);
process.on("SIGINT", () => process.exit(130));

let base = process.env.BASE_URL;
if (!base) {
  if (process.env.BYGG !== "0") {
    console.log("bygger (pnpm build) …");
    const b = spawnSync("pnpm", ["build"], {
      cwd: ROOT,
      env,
      stdio: "inherit",
    });
    if (b.status !== 0) process.exit(b.status ?? 1);
  }
  const port = await freePort();
  base = `http://localhost:${port}`;
  let log = "";
  const srv = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  srv.stdout.on("data", (d) => (log += d));
  srv.stderr.on("data", (d) => (log += d));
  children.push(srv);
  console.log(`starter next start på ${base} (pid ${srv.pid})`);
  await waitFor(async () => (await fetch(base)).ok, 60000, "next start").catch(
    (e) => {
      console.error(log);
      throw e;
    },
  );
}

const cdpPort = await freePort();
const profile = mkdtempSync(join(tmpdir(), "csp-sjekk-"));
const chrome = spawn(
  findChrome(),
  [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile}`,
    "--window-size=1440,900",
    "--mute-audio",
    // Headless has no GPU: software WebGL, so SLEDEFLUKT really builds its shaders
    "--enable-unsafe-swiftshader",
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
const brudd = new Set();
const MERKE = "CSP-BRUDD ";
const erCsp = (t) => /Content Security Policy|Refused to/.test(t);
ws.addEventListener("message", ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    return msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  }
  const p = msg.params;
  if (msg.method === "Runtime.exceptionThrown")
    brudd.add(
      `pageerror: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`,
    );
  if (msg.method === "Runtime.consoleAPICalled") {
    const t = p.args.map((a) => a.value ?? a.description).join(" ");
    if (t.startsWith(MERKE)) brudd.add(t.slice(MERKE.length));
    else if (erCsp(t)) brudd.add(`console: ${t}`);
  }
  if (msg.method === "Log.entryAdded" && erCsp(p.entry.text))
    brudd.add(`log: ${p.entry.text} ${p.entry.url ?? ""}`);
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
const has = (sel) =>
  evaluate(`!!document.querySelector(${JSON.stringify(sel)})`);
const typeInto = async (selector, value) => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  await send("Input.insertText", { text: value });
  for (const type of ["keyDown", "keyUp"])
    await send("Input.dispatchKeyEvent", {
      type,
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      ...(type === "keyDown" ? { text: "\r" } : {}),
    });
};
const goto = async (path) => {
  await send("Page.navigate", { url: base + path });
  await waitFor(
    () => evaluate("document.readyState === 'complete'"),
    30000,
    `lasting av ${path}`,
  );
};

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
// The browser's own report, in every frame (print thumbnails are iframes): directive + blocked URL
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `addEventListener("securitypolicyviolation", (e) => console.log(${JSON.stringify(MERKE)} + e.effectiveDirective + " blokkerte " + (e.blockedURI || "inline") + " på " + location.pathname + (e.sourceFile ? " (" + e.sourceFile + ":" + e.lineNumber + ")" : "")));`,
});

const feil = [];
const steg = async (navn, fn) => {
  const før = brudd.size;
  try {
    await fn();
    await sleep(1500); // late chunks and effects
  } catch (e) {
    feil.push(`${navn}: ${e.message}`);
  }
  const nye = brudd.size - før;
  console.log(
    `${feil.at(-1)?.startsWith(navn + ":") ? "FEIL" : nye ? "BRUDD" : "OK  "} ${navn}${nye ? ` (${nye} brudd)` : ""}`,
  );
};

const LOGIN = "input[aria-label='Ord 1 av 3']";
await steg("barneappen: innlogging og skrivebord", async () => {
  await goto("/");
  const csp = await evaluate(
    `fetch("/").then((r) => r.headers.get("content-security-policy"))`,
  );
  if (!/script-src[^;]*'nonce-/.test(csp ?? "") || /unsafe-eval/.test(csp))
    throw new Error(`uventet CSP-header: ${csp}`);
  await waitFor(() => evaluate("!!window.nissekomm?.sim"), 30000, "sim");
  // Self-check: a forbidden image must be reported, or a clean run proves nothing
  await evaluate(`new Image().src = "https://csp-sjekk.invalid/x.png"`);
  const egne = () => [...brudd].filter((b) => b.includes("csp-sjekk.invalid"));
  await waitFor(
    () => egne().some((b) => b.startsWith("img-src")),
    5000,
    "detektoren fanget ikke et bevisst img-src-brudd",
  );
  egne().forEach((b) => brudd.delete(b));
  // Day 8: SLEDEFLUKT is on the desktop
  await evaluate(`window.nissekomm.sim.goTo(8, "08:00")`);
  await goto("/");
  await waitFor(() => has(LOGIN), 30000, "innloggingsskjema");
  await typeInto(LOGIN, KID_CODE);
  await waitFor(async () => !(await has(LOGIN)), 15000, "innlogging");
  await waitFor(
    () => evaluate(`/KODETERMINAL|VIDEODAGBOK/.test(document.body.innerText)`),
    30000,
    "skrivebord",
  );
});

await steg("SLEDEFLUKT (WebGL)", async () => {
  await evaluate(
    `document.querySelector('[aria-label=Lukk]')?.click(); new Promise((r) => setTimeout(r, 600))`,
  );
  const klikk = (label) =>
    evaluate(`(() => {
      const el = [...document.querySelectorAll('button, [role=button], div, span')]
        .find((e) => e.offsetParent !== null && e.innerText?.trim() === ${JSON.stringify(label)});
      (el?.closest('button,[role=button]') ?? el?.querySelector('button,[role=button]') ?? el)?.click();
      return !!el;
    })()`);
  await waitFor(() => klikk("SLEDEFLUKT"), 15000, "SLEDEFLUKT-ikonet");
  await waitFor(() => has("canvas"), 15000, "canvas i SLEDEFLUKT");
  if (
    !(await evaluate(`!!document.createElement("canvas").getContext("webgl")`))
  )
    throw new Error("nettleseren ga ingen WebGL-kontekst");
});

await steg("guiden: innlogging og I dag", async () => {
  await goto("/nissemor-guide/i-dag");
  await waitFor(() => has("#parentCode"), 30000, "guide-innlogging");
  await typeInto("#parentCode", PARENT_CODE);
  await waitFor(
    async () => !(await has("#parentCode")),
    15000,
    "innlogging i guiden",
  );
  await sleep(2000);
});

await steg(
  "guiden: dag 8 med utskriftsminiatyrer (iframe ?bare=1)",
  async () => {
    await goto("/nissemor-guide/dag/8");
    await waitFor(
      () =>
        evaluate(`(() => {
        // The 1:1 dialog's frame is lazy and stays empty until opened: one drawn sheet is enough
        const f = [...document.querySelectorAll('iframe[src*="bare=1"]')];
        f[0]?.scrollIntoView();
        return f.some((x) => x.contentDocument?.querySelector("[data-ark]"));
      })()`),
      30000,
      "utskriftsminiatyrer (iframe ?bare=1) på dag 8",
    );
  },
);

await steg("guiden: service worker", async () => {
  await waitFor(
    () =>
      evaluate(
        `navigator.serviceWorker.getRegistration("/nissemor-guide/").then((r) => !!r?.active && r.active.scriptURL.endsWith("/nissemor-guide/sw.js"))`,
      ),
    20000,
    "/nissemor-guide/sw.js registreres ikke",
  );
});

// The self-check's own violation can be logged a second time after its step
for (const b of brudd) if (b.includes("csp-sjekk.invalid")) brudd.delete(b);
ws.close();
for (const b of brudd) console.log(`  brudd: ${b}`);
for (const f of feil) console.log(`  feil: ${f}`);
console.log(
  brudd.size || feil.length
    ? `\nFEIL: ${brudd.size} CSP-brudd/sidefeil, ${feil.length} steg feilet`
    : "\nOK: ingen CSP-brudd",
);
process.exit(brudd.size || feil.length ? 1 : 0);
