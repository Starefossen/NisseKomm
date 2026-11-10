#!/usr/bin/env python3
"""One queue for all generated media: plan it, run it, resume it.

Usage:
  generer.py plan [--til-dag N] [--bare KAT]
  generer.py kjør [--til-dag N] [--bare julius|rampenissen|tv|port|test|musikk]
                  [--maks-forespørsler N] [--stopp-etter julius:5]
  generer.py --selvtest

Order: (a) named tests, (b) Julius days ✗/⚠, (c) Rampenissen ✗/⚠, (d) TV loops and
events, (e) gate entrances, (f) the hidden NisseMusikk track. ✓ current and ? unknown
are skipped. A daily-limit or spending-cap error stops the run with exit code 75.

Video requests are counted from lines julius.sh and loop.sh append to $GENERER_LOGG
after each POST to the interactions API. The API answers synchronously with the video,
so there are no status polls to count. TTS and image calls do not count against the limit.
State: assets/out/generer-tilstand.json (requests per quota day, last error, per item).
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))
import inventar  # noqa: E402
import medie  # noqa: E402

ROOT = medie.ROOT
BIN = ROOT / "assets/bin"
STATE = ROOT / "assets/out/generer-tilstand.json"
DAY_LIMIT = 200
RETRY = 1.5  # expected takes per clip (julius-dag.py retries up to 3)
EXIT_LIMIT = 75  # EX_TEMPFAIL: try again after the quota resets
LIMIT_RE = re.compile(r"per day|spending cap|Stoppet: (dagsgrensen|månedlig)", re.I)
RETRY_RE = re.compile(r'retryDelay"?:\s*"?(\d+)s|retry in ([\d.]+)\s*s', re.I)

# Named tests: one Julius clip each, made with julius.sh into assets/out/<name>.mp4.
TESTS = {
    "test-klementin": {
        "linje": "Og se hva jeg fant under bordet i dag! En klementin. Den lukter jul.",
        "handling": "Venstre hånd løfter rolig en klementin opp fra under bordkanten, holder den opp foran seg "
                    "og legger den på bordet ved trekoppen, der den blir liggende. Høyre hånd holder mikrofonen hele tiden.",
        "sek": 8,
    },
}


def quota_day() -> str:
    # ponytail: Gemini daily quotas reset at midnight Pacific (~09:00 in Norway)
    return datetime.now(ZoneInfo("America/Los_Angeles")).date().isoformat()


def media_dir() -> Path:
    return Path(os.environ.get("MEDIA_DIR") or ROOT / "public")


def tv_jobs():
    out = subprocess.run(["bash", str(BIN / "tv-loops.sh"), "--liste"], capture_output=True, text=True, check=True).stdout
    return out.split()


def queue(rows, tv_names, root: Path = ROOT, til_dag=24):
    """[(id, category, estimated video requests, command)] in priority order."""
    st = {r["path"]: r["status"] for r in rows}
    todo = (medie.MISSING, medie.STALE)
    q = []
    for name, t in TESTS.items():
        if not (root / f"assets/out/{name}.mp4").exists():
            q.append((name, "test", RETRY, [str(BIN / "julius.sh"), name, t["linje"], t["handling"], str(t["sek"])]))
    for d in range(1, til_dag + 1):
        segs = medie.julius_segments(d, root)
        if segs and st.get(f"video/julius/dag-{d:02d}.mp4") in todo:
            q.append((f"julius:{d}", "julius", len(segs) * RETRY, ["python3", str(BIN / "julius-dag.py"), str(d)]))
    for d in range(1, til_dag + 1):
        if medie.rampenissen_text(d, root) and st.get(f"audio/rampenissen/dag-{d:02d}.mp3") in todo:
            q.append((f"rampenissen:{d}", "rampenissen", 0, ["bash", str(BIN / "rampenissen-tts.sh"), str(d)]))
    for n in tv_names:
        if st.get(f"video/tv/{n}.mp4", medie.MISSING) in todo:
            cat = "port" if n.startswith("port-") else "tv"
            q.append((f"{cat}:{n}", cat, RETRY, ["bash", str(BIN / "tv-loops.sh"), "--bare", n]))
    if st.get("music/rampenissen-synger.mp3", medie.MISSING) in todo:
        q.append(("musikk:rampenissen-synger", "musikk", 0, ["bash", str(BIN / "rampenissen-tts.sh"), "synger"]))
    return q


def load_state(path: Path):
    s = json.loads(path.read_text()) if path.exists() else {}
    s.setdefault("forespørsler", {})
    s.setdefault("elementer", {})
    s["merknad"] = "videoforespørsler = POST til interactions; statusspørringer finnes ikke (synkront svar)"
    return s


def save_state(path: Path, s):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(s, ensure_ascii=False, indent=1) + "\n")


def run_cmd(cmd, env):
    """Run, echo output live, return (exit code, output)."""
    p = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, stdin=subprocess.DEVNULL)
    out = []
    for line in p.stdout:
        print("  " + line, end="")
        out.append(line)
    return p.wait(), "".join(out)


def done(item_id, root: Path, media: Path) -> bool:
    """Is the item's output now ✓? Tests only need the file."""
    cat, _, key = item_id.partition(":")
    if item_id in TESTS:
        return (root / f"assets/out/{item_id}.mp4").exists()
    path = {"julius": f"video/julius/dag-{int(key or 0):02d}.mp4", "rampenissen": f"audio/rampenissen/dag-{int(key or 0):02d}.mp3",
            "tv": f"video/tv/{key}.mp4", "port": f"video/tv/{key}.mp4", "musikk": f"music/{key}.mp3"}[cat]
    return medie.status(media / path, path, root)[0] == medie.CURRENT


def run(q, state_path: Path, maks=None, stopp_etter=None, runner=run_cmd, check=None):
    """Run the queue; returns the exit code (0 done/stopped, 1 an item failed, 75 limit)."""
    check = check or (lambda i: done(i, ROOT, media_dir()))
    s = load_state(state_path)
    today = quota_day()
    budget = min(DAY_LIMIT, maks if maks is not None else DAY_LIMIT)
    log = Path(tempfile.mkstemp(prefix="generer-", suffix=".logg")[1])
    env = {**os.environ, "GENERER_LOGG": str(log)}
    try:
        for item_id, cat, est, cmd in q:
            used = s["forespørsler"].get(today, 0)
            if s["elementer"].get(item_id, {}).get("status") == "ferdig" and check(item_id):
                continue
            if est and used + est > budget:
                print(f"Stopper før {item_id}: {used} brukt, anslag {est:g}, grense {budget}")
                save_state(state_path, s)
                return 0
            print(f"▶ {item_id} (anslag {est:g} videoforespørsler, {used} brukt i dag)")
            before = len(log.read_text().splitlines())
            rc, out = runner(cmd, env)
            sent = len(log.read_text().splitlines()) - before
            s["forespørsler"][today] = used + sent
            limit = LIMIT_RE.search(out)
            ok = rc == 0 and not limit and check(item_id)
            s["elementer"][item_id] = {"status": "ferdig" if ok else "feilet", "forespørsler": sent,
                                       "tid": datetime.now().isoformat(timespec="seconds")}
            if limit:
                m = RETRY_RE.search(out)
                wait = f", prøv igjen om {m.group(1) or m.group(2)} s" if m else ", prøv igjen etter at kvoten nullstilles (ca. 09:00)"
                s["siste_feil"] = f"{item_id}: {limit.group(0)}{wait}"
                save_state(state_path, s)
                print(f"Stoppet: grense nådd ved {item_id} ({limit.group(0)}){wait}. Kjør igjen for å fortsette.")
                return EXIT_LIMIT
            if not ok:
                s["siste_feil"] = f"{item_id}: exit {rc}"
                save_state(state_path, s)
                print(f"Feil i {item_id} (exit {rc}); retter du den, fortsetter neste kjøring herfra.")
                return 1
            save_state(state_path, s)
            if stopp_etter == item_id:
                print(f"Stopper etter {item_id} for gjennomsyn.")
                return 0
    finally:
        log.unlink(missing_ok=True)
    print("Køen er tom.")
    return 0


def plan(q, used: int):
    total = 0.0
    for item_id, cat, est, _ in q:
        total += est
        print(f"{item_id:38} {est:5g}   sum {total:6g}")
    days = -(-total // DAY_LIMIT) if total else 0
    print(f"\n{len(q)} elementer, ca. {total:g} videoforespørsler (×{RETRY} for nye forsøk); "
          f"{used} brukt i dag av {DAY_LIMIT}, {days:g} dag(er) med full kvote.")


def arg(argv, name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv):
    if not argv or argv[0] not in ("plan", "kjør"):
        sys.exit(__doc__)
    til = int(arg(argv, "--til-dag", 24))
    bare = arg(argv, "--bare")
    q = queue(inventar.scan(media_dir()), tv_jobs(), til_dag=til)
    if bare:
        q = [i for i in q if i[1] == bare]
    if argv[0] == "plan":
        plan(q, load_state(STATE)["forespørsler"].get(quota_day(), 0))
        return 0
    maks = arg(argv, "--maks-forespørsler")
    return run(q, STATE, int(maks) if maks else None, arg(argv, "--stopp-etter"))


def selftest():
    """Fake inventory and a fake API that hits the daily limit on call N; then resume."""
    with tempfile.TemporaryDirectory() as t:
        root = Path(t)
        (root / "docs/manus").mkdir(parents=True)
        (root / medie.JULIUS_MS).write_text("".join(
            f"## Dag {d} (x)\n**Replikk:** «Hei {d}»\n- Varighet: 8 s\n- Handling: smil\n- Kulde: ingen\n" for d in (1, 2, 3)))
        (root / medie.RAMPE_MS).write_text("## Dag 1 (x)\n**Klipp:** «Hei!»\n")
        rows = [{"path": "video/julius/dag-01.mp4", "status": medie.CURRENT},
                {"path": "video/julius/dag-02.mp4", "status": medie.MISSING},
                {"path": "video/julius/dag-03.mp4", "status": medie.STALE},
                {"path": "audio/rampenissen/dag-01.mp3", "status": medie.UNKNOWN},
                {"path": "video/tv/landsby-rolig.mp4", "status": medie.UNKNOWN},
                {"path": "music/rampenissen-synger.mp3", "status": medie.CURRENT}]
        q = queue(rows, ["landsby-rolig", "landsby-morgen", "port-iq"], root)
        assert [i[0] for i in q] == ["test-klementin", "julius:2", "julius:3", "tv:landsby-morgen", "port:port-iq"], q
        calls, made = [], set()

        def fake(cmd, env, fail_on=3):
            calls.append(cmd)
            with open(env["GENERER_LOGG"], "a") as f:
                f.write("video x\n")
            if len(calls) == fail_on:
                return 1, '{"error":{"message":"Quota exceeded: requests per day","details":[{"retryDelay":"3600s"}]}}'
            made.add(next(i[0] for i in q if i[3] == cmd))
            return 0, "ok"

        st = root / "tilstand.json"
        rc = run(q, st, runner=fake, check=lambda i: i in made)
        s = json.loads(st.read_text())
        assert rc == EXIT_LIMIT, rc
        assert s["forespørsler"][quota_day()] == 3
        assert s["elementer"]["julius:3"]["status"] == "feilet" and "3600" in s["siste_feil"]
        rc = run(q, st, runner=lambda c, e: fake(c, e, fail_on=0), check=lambda i: i in made)
        assert rc == 0 and len(calls) == 6, calls  # resumed at julius:3, tests and julius:2 skipped
        assert json.loads(st.read_text())["forespørsler"][quota_day()] == 6
        # budget: stop before an item that would exceed --maks-forespørsler
        calls.clear()
        assert run(q, root / "t2.json", maks=2, runner=lambda c, e: fake(c, e, fail_on=0), check=lambda i: True) == 0
        assert len(calls) == 1  # test ran (1 sent), julius:2 (1.5) would pass 2
        # --stopp-etter
        calls.clear()
        made.clear()
        assert run(q, root / "t4.json", stopp_etter="julius:2", runner=lambda c, e: fake(c, e, fail_on=0),
                   check=lambda i: i in made) == 0 and len(calls) == 2
    print("selvtest ok")


if __name__ == "__main__":
    if "--selvtest" in sys.argv:
        selftest()
    else:
        sys.exit(main(sys.argv[1:]))
