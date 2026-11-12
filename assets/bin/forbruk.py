#!/usr/bin/env python3
"""Forbruk: one usage log for every paid Gemini call, prices, and the budget guard.

  forbruk.py logg <type> <modell> <skript> <element>   append a line (shell scripts call this at the call site)
  forbruk.py sjekk <type> [antall]                     exit 78 if estimate since BUDSJETT_FRA + this would pass BUDSJETT
  forbruk.py rapport                                   today, this week, since BUDSJETT_FRA, calls per type
  forbruk.py --selvtest

Log: assets/out/forbruk.jsonl (gitignored, one JSON object per call). OVER_BUDSJETT=1 lifts the guard
(the scripts' --over-budsjett flag sets it; Hans approves that).
"""
import json
import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(os.environ.get("NISSEKOMM_ROOT") or Path(__file__).resolve().parents[2])
LOGG = Path(os.environ.get("FORBRUK_LOGG") or ROOT / "assets/out/forbruk.jsonl")

# ESTIMATES in NOK per call; Hans adjusts these.
PRIS = {"video": 17.0, "bilde": 1.4, "tts": 0.1, "transkripsjon": 0.1}
BUDSJETT = 2000.0  # NOK of new generation from BUDSJETT_FRA (4500 NOK was spent before)
BUDSJETT_FRA = date(2026, 11, 13)
EXIT_BUDSJETT = 78


def logg(typ, modell, skript, element, tokens=None, estimert=False, t=None):
    assert typ in PRIS, typ
    rad = {"t": t or datetime.now().isoformat(timespec="seconds"), "type": typ, "modell": modell, "skript": skript, "element": element}
    if tokens:
        rad["tokens"] = tokens
    if estimert:
        rad["estimert"] = True
    LOGG.parent.mkdir(parents=True, exist_ok=True)
    with LOGG.open("a") as f:
        f.write(json.dumps(rad, ensure_ascii=False) + "\n")


def rader():
    if not LOGG.exists():
        return []
    return [json.loads(l) for l in LOGG.read_text().splitlines() if l.strip()]


def kostnad(rs):
    return sum(PRIS[r["type"]] * r.get("antall", 1) for r in rs)


def siden(d, rs=None):
    return [r for r in (rader() if rs is None else rs) if datetime.fromisoformat(r["t"]).date() >= d]


def sjekk(typ, antall=1.0):
    """Exit message when spend since BUDSJETT_FRA plus this job's estimate would pass the budget."""
    if os.environ.get("OVER_BUDSJETT") == "1":
        return None
    brukt, nytt = kostnad(siden(BUDSJETT_FRA)), PRIS[typ] * antall
    if brukt + nytt > BUDSJETT:
        return (f"Stoppet: budsjett ({brukt:.0f} NOK brukt siden {BUDSJETT_FRA:%d.%m} + anslag {nytt:.0f} NOK > {BUDSJETT:.0f} NOK). "
                "Hans må godkjenne mer: kjør på nytt med --over-budsjett.")


def rapport():
    rs = rader()
    i_dag = date.today()
    uke = i_dag - timedelta(days=6)
    print(f"{'':16}{'NOK':>8}   anrop")
    for navn, fra in (("i dag", i_dag), ("siste 7 dager", uke), (f"siden {BUDSJETT_FRA:%d.%m}", BUDSJETT_FRA)):
        s = siden(fra, rs)
        per = ", ".join(f"{t} {sum(r.get('antall', 1) for r in s if r['type'] == t):g}" for t in PRIS)
        print(f"{navn:16}{kostnad(s):8.0f}   {per}")
    brukt = kostnad(siden(BUDSJETT_FRA, rs))
    print(f"\nBudsjett {BUDSJETT:.0f} NOK fra {BUDSJETT_FRA:%d.%m}: brukt {brukt:.0f}, igjen {BUDSJETT - brukt:.0f}")
    før = [r for r in rs if datetime.fromisoformat(r["t"]).date() < BUDSJETT_FRA]
    print(f"Før {BUDSJETT_FRA:%d.%m} (ikke i budsjettet): {kostnad(før):.0f} NOK")
    print("Priser (anslag per anrop, NOK): " + ", ".join(f"{k} {v:g}" for k, v in PRIS.items()) + "; rediger PRIS i forbruk.py")
    if any(r.get("estimert") for r in rs):
        print("Linjer merket «estimert» er rekonstruert, ikke målt.")


def selvtest():
    import tempfile
    global LOGG, BUDSJETT_FRA
    with tempfile.TemporaryDirectory() as d:
        LOGG, BUDSJETT_FRA = Path(d) / "f.jsonl", date.today()
        os.environ.pop("OVER_BUDSJETT", None)
        assert sjekk("video") is None
        for _ in range(117):  # 117 * 17 = 1989; one more video passes 2000
            logg("video", "m", "t", "x")
        assert kostnad(siden(date.today())) == 117 * 17 and sjekk("video")
        assert sjekk("bilde") is None
        os.environ["OVER_BUDSJETT"] = "1"
        assert sjekk("video") is None
        logg("tts", "m", "t", "x", tokens=5, estimert=True, t="2000-01-01T00:00:00")
        assert len(siden(date.today())) == 117 and len(rader()) == 118
        rapport()
    print("selvtest ok")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--selvtest"]:
        selvtest()
    elif a[:1] == ["logg"]:
        logg(*a[1:5], tokens=int(a[5]) if len(a) > 5 and a[5].isdigit() else None)
    elif a[:1] == ["sjekk"]:
        m = sjekk(a[1], float(a[2]) if len(a) > 2 else 1)
        if m:
            print(m, file=sys.stderr)
            sys.exit(EXIT_BUDSJETT)
    elif a[:1] == ["rapport"]:
        rapport()
    else:
        sys.exit(__doc__)
