#!/usr/bin/env python3
"""One queue for all generated media: plan it, run it, resume it.

Usage:
  generer.py plan [--til-dag N] [--bare KAT] [--force]
  generer.py kjør [--til-dag N] [--bare julius|rampenissen|tv|port|test|musikk|slede]
                  [--maks-forespørsler N] [--stopp-etter julius:5] [--force]
  generer.py --selvtest

Order: (a) named tests, (b) Julius days ✗/⚠, (c) Rampenissen ✗/⚠, (d) TV loops and
events, (e) gate entrances, (f) the hidden NisseMusikk track, (g) sleigh horizon stills
(images, 0 video requests). ✓ current and ? unknown
are skipped. Items marked «Lag på nytt» in media-vurdering.json are queued (and their
mark removed on success), while «Godkjent» items are skipped unless --force.
A daily-limit or spending-cap error stops the run with exit code 75.

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
MEDIER = medie.jobs()  # assets/medier.json; TV loops are listed by tv-loops.sh --liste
IMAGE_CATS = ("slede", "spill", "portrett")  # sleigh horizons, Ugleposten stills, pixel portraits (0 video requests)


def names(cat):
    return [k.split("/", 1)[1] for k in MEDIER if k.startswith(cat + "/")]


SLEDE, SPILL, PORTRETT = (names(c) for c in IMAGE_CATS)
STILL_SH = ('mkdir -p "$(dirname "$3")" && bash "$4/still.sh" "$1" "$2" "$3" "${@:5}" && '
            'python3 "$4/medie.py" skriv still.sh "$3" "$2" - gemini-3-pro-image "$1" "${@:5}"')
PORTRETT_SH = ('mkdir -p "$(dirname "$3")" "$5" && bash "$4/portrett.sh" "$2" "$5/$(basename "$3")" "${@:6}" && '
               'bash "$4/piksel.sh" "$5/$(basename "$3")" "$3" && '
               'python3 "$4/medie.py" skriv portrett.sh "$3" "$2" - gemini-3-pro-image "${@:6}"')
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


def vurdering_path(media: Path = None) -> Path:
    return (media or media_dir()) / "media-vurdering.json"


def load_vurderinger(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def save_vurderinger(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(f".tmp.{os.getpid()}")
    try:
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        tmp.replace(path)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise


def is_redo(v) -> bool:
    val = (v.get("vurdering") or v.get("status")) if isinstance(v, dict) else v
    return val in ("lag_paa_nytt", "lag_på_nytt", "redo")


def is_approved(v) -> bool:
    val = (v.get("vurdering") or v.get("status")) if isinstance(v, dict) else v
    return val in ("godkjent", "approved")


def item_path(item_id: str) -> str:
    cat, _, key = item_id.partition(":")
    if item_id in TESTS:
        return f"assets/out/{item_id}.mp4"
    if cat == "julius":
        return f"video/julius/dag-{int(key):02d}.mp4" if key.isdigit() else ""
    if cat == "rampenissen":
        return f"audio/rampenissen/dag-{int(key):02d}.mp3" if key.isdigit() else ""
    if cat == "slede":
        return f"feed/slede-{key}.jpg"
    if cat == "spill":
        return f"spill/{key}.jpg"
    if cat == "portrett":
        return f"spill/portrett-{key}.png"
    if cat in ("tv", "port"):
        return f"video/tv/{key}.mp4"
    if cat == "musikk":
        return f"music/{key}.mp3"
    return ""


def tv_jobs():
    out = subprocess.run(["bash", str(BIN / "tv-loops.sh"), "--liste"], capture_output=True, text=True, check=True).stdout
    return out.split()


VENTER = set()  # item ids held back from the queue


def queue(rows, tv_names, root: Path = ROOT, til_dag=24, vurderinger=None, force=False):
    """[(id, category, estimated video requests, command)] in priority order."""
    st = {r["path"]: r["status"] for r in rows}
    todo = (medie.MISSING, medie.STALE)
    vurd = vurderinger or {}
    q = []

    def should_queue(p: str, current_status) -> bool:
        v = vurd.get(p)
        if is_redo(v):
            return True
        if is_approved(v) and not force:
            return False
        if force:
            return True
        return current_status in todo

    for name, t in TESTS.items():
        p = f"assets/out/{name}.mp4"
        if not (root / p).exists() or is_redo(vurd.get(p)) or (force and not is_approved(vurd.get(p))):
            q.append((name, "test", RETRY, [str(BIN / "julius.sh"), name, t["linje"], t["handling"], str(t["sek"])]))
    for d in range(1, til_dag + 1):
        segs = medie.julius_segments(d, root)
        p = f"video/julius/dag-{d:02d}.mp4"
        if segs and should_queue(p, st.get(p, medie.MISSING)):
            q.append((f"julius:{d}", "julius", len(segs) * RETRY, ["python3", str(BIN / "julius-dag.py"), str(d)]))
    for d in range(1, til_dag + 1):
        p = f"audio/rampenissen/dag-{d:02d}.mp3"
        if medie.rampenissen_text(d, root) and should_queue(p, st.get(p, medie.MISSING)):
            q.append((f"rampenissen:{d}", "rampenissen", 0, ["bash", str(BIN / "rampenissen-tts.sh"), str(d)]))
    for n in tv_names:
        p = f"video/tv/{n}.mp4"
        if should_queue(p, st.get(p, medie.MISSING)):
            cat = "port" if n.startswith("port-") else "tv"
            q.append((f"{cat}:{n}", cat, RETRY, ["bash", str(BIN / "tv-loops.sh"), "--bare", n]))
    for cat in IMAGE_CATS:
        for n in names(cat):
            p = MEDIER[f"{cat}/{n}"]["ut"]
            if not should_queue(p, st.get(p, medie.MISSING)):
                continue
            prompt, img, refs = medie.render(f"{cat}/{n}", ROOT, MEDIER)
            refs = [str(root / r) for r in refs]
            if cat == "portrett":
                cmd = [PORTRETT_SH, "_", "", str(root / prompt), str(media_dir() / p), str(BIN),
                       str(root / "assets/out"), *refs]
            else:  # still.sh makes the image; medie.py skriv records the sidecar so it counts as current
                cmd = [STILL_SH, "_", str(root / img), str(root / prompt), str(media_dir() / p), str(BIN), *refs]
            q.append((f"{cat}:{n}", cat, 0, ["bash", "-c", *cmd]))
    p_music = "music/rampenissen-synger.mp3"
    if should_queue(p_music, st.get(p_music, medie.MISSING)):
        q.append(("musikk:rampenissen-synger", "musikk", 0, ["bash", str(BIN / "rampenissen-tts.sh"), "synger"]))
    return [j for j in q if j[0] not in VENTER]


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
    if item_id in TESTS:
        return (root / f"assets/out/{item_id}.mp4").exists()
    path = item_path(item_id)
    return medie.status(media / path, path, root)[0] == medie.CURRENT


def run(q, state_path: Path, maks=None, stopp_etter=None, runner=run_cmd, check=None,
        vurdering_fil: Path = None):
    """Run the queue; returns the exit code (0 done/stopped, 1 an item failed, 75 limit)."""
    check = check or (lambda i: done(i, ROOT, media_dir()))
    vpath = vurdering_fil or vurdering_path()
    vurderinger = load_vurderinger(vpath)
    s = load_state(state_path)
    today = quota_day()
    budget = min(DAY_LIMIT, maks if maks is not None else DAY_LIMIT)
    log = Path(tempfile.mkstemp(prefix="generer-", suffix=".logg")[1])
    env = {**os.environ, "GENERER_LOGG": str(log)}
    try:
        for item_id, cat, est, cmd in q:
            used = s["forespørsler"].get(today, 0)
            item_p = item_path(item_id)
            redo = is_redo(vurderinger.get(item_p))
            if not redo and s["elementer"].get(item_id, {}).get("status") == "ferdig" and check(item_id):
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
            if ok and redo:
                if isinstance(vurderinger.get(item_p), dict):
                    vurderinger[item_p].pop("vurdering", None)
                    vurderinger[item_p].pop("status", None)
                    if not vurderinger[item_p]:
                        vurderinger.pop(item_p, None)
                else:
                    vurderinger.pop(item_p, None)
                save_vurderinger(vpath, vurderinger)
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
    force = "--force" in argv
    vpath = vurdering_path()
    vurd = load_vurderinger(vpath)
    q = queue(inventar.scan(media_dir()), tv_jobs(), til_dag=til, vurderinger=vurd, force=force)
    if bare:
        q = [i for i in q if i[1] == bare]
    if argv[0] == "plan":
        plan(q, load_state(STATE)["forespørsler"].get(quota_day(), 0))
        return 0
    maks = arg(argv, "--maks-forespørsler")
    return run(q, STATE, int(maks) if maks else None, arg(argv, "--stopp-etter"), vurdering_fil=vpath)


def selftest():
    """Fake inventory and a fake API that hits the daily limit on call N; then resume."""
    medie.selftest()
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
                {"path": "music/rampenissen-synger.mp3", "status": medie.CURRENT},
                *({"path": f"feed/slede-{v}.jpg", "status": medie.CURRENT} for v in SLEDE),
                *({"path": f"spill/{n}.jpg", "status": medie.CURRENT} for n in SPILL),
                *({"path": f"spill/portrett-{n}.png", "status": medie.CURRENT} for n in PORTRETT)]
        q = queue(rows, ["landsby-rolig", "landsby-morgen", "port-iq"], root)
        assert [i[0] for i in q] == ["test-klementin", "julius:2", "julius:3", "tv:landsby-morgen", "port:port-iq"], q
        # sleigh stills: queued when missing, as images (estimate 0, so never counted against the video quota)
        qs = queue([r for r in rows if r["path"] != "feed/slede-julenatt.jpg"], [], root, til_dag=0)
        assert [(i[0], i[2]) for i in qs if i[1] == "slede"] == [("slede:julenatt", 0)], qs
        qp = queue([r for r in rows if not r["path"].startswith("spill/")], [], root, til_dag=0)
        assert sorted(i[0] for i in qp if i[1] == "spill") == sorted(f"spill:{n}" for n in SPILL)
        assert all(i[2] == 0 for i in qp if i[1] == "spill") and item_path("spill:torget") == "spill/torget.jpg"
        assert item_path("slede:muren") == "feed/slede-muren.jpg"
        assert item_path("portrett:winter") == "spill/portrett-winter.png"
        qr = queue([r for r in rows if r["path"] != "spill/portrett-winter.png"], [], root, til_dag=0)
        assert [i[0] for i in qr if i[1] == "portrett"] == ["portrett:winter"], qr
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

        # media-vurdering: queue honours verdicts and removes mark on success
        v_test = {
            "video/julius/dag-01.mp4": {"vurdering": "lag_paa_nytt"},
            "video/julius/dag-03.mp4": {"vurdering": "godkjent"},
        }
        q_v = queue(rows, ["landsby-rolig"], root, vurderinger=v_test)
        q_v_ids = [i[0] for i in q_v]
        assert "julius:1" in q_v_ids, q_v_ids  # queued because lag_paa_nytt
        assert "julius:2" in q_v_ids, q_v_ids  # queued because MISSING
        assert "julius:3" not in q_v_ids, q_v_ids  # skipped because godkjent

        # with force=True, godkjent item julius:3 is queued
        q_force = queue(rows, ["landsby-rolig"], root, vurderinger=v_test, force=True)
        assert "julius:3" in [i[0] for i in q_force]

        # mark removal after successful run
        v_file = root / "media-vurdering.json"
        v_file.write_text(json.dumps({"video/julius/dag-01.mp4": {"vurdering": "lag_paa_nytt", "notat": "fikse"}}))
        run([("julius:1", "julius", 0, ["echo", "1"])], root / "t_v.json",
            runner=lambda c, e: (0, "ok"),
            check=lambda i: True, vurdering_fil=v_file)
        v_after = json.loads(v_file.read_text())
        assert "vurdering" not in v_after.get("video/julius/dag-01.mp4", {})
        assert v_after.get("video/julius/dag-01.mp4", {}).get("notat") == "fikse"
    print("selvtest ok")


if __name__ == "__main__":
    if "--selvtest" in sys.argv:
        selftest()
    else:
        sys.exit(main(sys.argv[1:]))
