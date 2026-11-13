#!/usr/bin/env python3
"""Numbers for the write-up: paid tries against approved items, before and after the script gate.

  tall.py [mediemappe]   print the table and write assets/out/tall-<ISO-uke>.json (overwritten each run)
  tall.py --selvtest

Per type (julius per segment, radio, tv, bilde, manus, transkripsjon): paid tries and NOK (forbruk.jsonl),
approved items (godkjent/ok in media-vurdering.json), tries per approved, review rounds per item (every
verdict an element has had, historikk included; derived ones not counted), and NOK per approved video minute.
Split at GRENSE (the script gate, 13.11 14:00 Oslo): tries by log time, verdicts by `oppdatert`.
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))
import forbruk  # noqa: E402
import medie  # noqa: E402

OSLO = ZoneInfo("Europe/Oslo")
GRENSE = datetime(2026, 11, 13, 14, 0, tzinfo=OSLO)
BILDE = (".png", ".jpg", ".jpeg", ".webp")


def tid(s: str) -> datetime:
    t = datetime.fromisoformat(s.replace("Z", "+00:00"))
    return t if t.tzinfo else t.replace(tzinfo=OSLO)  # the log is local time


def logtype(r: dict) -> str:
    if r["type"] == "video":
        s = r.get("skript", "")
        return "julius" if "julius" in s and "loop" not in s else "tv" if "loop" in s and "julius" not in s else "video"
    return {"tts": "radio"}.get(r["type"], r["type"])


def idtype(id: str):
    if id.startswith("video/julius/"):
        return "julius"
    if id.startswith("audio/rampenissen/"):
        return "radio"
    if id.startswith("video/tv/"):
        return "tv"
    if id.startswith("manus/"):
        return "manus"
    if id.lower().endswith(BILDE):
        return "bilde"
    return None


def beregn(rader: list, lager: dict, manus: dict) -> dict:
    """{periode: {type: {...}}} for «før», «etter» and «alt»."""
    secs = {int(d): {s["s"]: s["key"][1] for s in segs} for d, segs in manus.items()}
    perioder = {"før": lambda t: t < GRENSE, "etter": lambda t: t >= GRENSE, "alt": lambda t: True}
    ut = {}
    for navn, i in perioder.items():
        p = {}
        rad = lambda typ: p.setdefault(typ, {"forsøk": 0, "nok": 0.0, "godkjent": 0, "runder": 0, "elementer": 0})
        for r in rader:
            if i(tid(r["t"])):
                x = rad(logtype(r))
                x["forsøk"] += r.get("antall", 1)
                x["nok"] += forbruk.PRIS[r["type"]] * r.get("antall", 1)
        minutter = 0.0
        segdager = {int(v["fil"][17:19]) for e in lager.get("elementer", {}).values() for v in e["vurderinger"]
                    if "#s" in v["fil"] and v["fil"].startswith("video/julius/")}
        for key, e in lager.get("elementer", {}).items():
            typ = idtype(key)
            if not typ:
                continue
            alle = [v for v in e["vurderinger"] + e["historikk"] if v.get("vurdering") and not v.get("kilde")]
            her = [v for v in alle if i(tid(v.get("oppdatert") or "2000-01-01"))]
            if her:
                x = rad(typ)
                x["runder"] += len(her)
                x["elementer"] += 1
            for v in e["vurderinger"]:
                if v.get("vurdering") not in ("godkjent", "ok") or not i(tid(v.get("oppdatert") or "2000-01-01")):
                    continue
                f = v["fil"]
                if typ == "julius" and "#s" in f:  # one segment
                    d, s = int(f[17:19]), int(f.split("#s")[1])
                    rad(typ)["godkjent"] += 1
                    minutter += secs.get(d, {}).get(s, 0) / 60
                elif typ == "julius":
                    # ponytail: a whole approved video counts all its script segments, unless segments carry verdicts
                    d = int(f[17:19])
                    if d not in segdager:
                        rad(typ)["godkjent"] += len(secs.get(d, {})) or 1
                        minutter += sum(secs.get(d, {}).values()) / 60
                else:
                    rad(typ)["godkjent"] += 1
        for x in p.values():
            x["nok"] = round(x["nok"], 1)
            x["forsøk_per_godkjent"] = round(x["forsøk"] / x["godkjent"], 2) if x["godkjent"] else None
            x["runder_per_element"] = round(x["runder"] / x["elementer"], 2) if x["elementer"] else None
        video_nok = sum(p.get(t, {}).get("nok", 0) for t in ("julius",))
        p["_julius"] = {"godkjente_minutter": round(minutter, 2),
                        "nok_per_godkjent_minutt": round(video_nok / minutter, 1) if minutter else None}
        ut[navn] = p
    return ut


def skriv_ut(res: dict):
    for navn, p in res.items():
        print(f"\n{navn.upper()} {'13.11 14:00' if navn != 'alt' else ''}".rstrip())
        print(f"  {'type':14}{'forsøk':>7}{'NOK':>8}{'godkj.':>7}{'f/godkj':>8}{'runder/el':>10}")
        for typ, x in sorted((k, v) for k, v in p.items() if not k.startswith("_")):
            fg = "-" if x["forsøk_per_godkjent"] is None else f"{x['forsøk_per_godkjent']:g}"
            re_ = "-" if x["runder_per_element"] is None else f"{x['runder_per_element']:g}"
            print(f"  {typ:14}{x['forsøk']:>7g}{x['nok']:>8.0f}{x['godkjent']:>7}{fg:>8}{re_:>10}")
        j = p["_julius"]
        print(f"  Julius: {j['godkjente_minutter']:g} godkjente min, "
              f"{'-' if j['nok_per_godkjent_minutt'] is None else round(j['nok_per_godkjent_minutt'])} NOK per godkjent minutt")


def main(media: Path):
    manus = json.loads((medie.ROOT / "src/data/julius-manus.json").read_text())
    res = beregn(forbruk.rader(), medie.les_lager(medie.vurdering_fil(media)), manus)
    skriv_ut(res)
    år, uke, _ = datetime.now(OSLO).isocalendar()
    ut = medie.ROOT / "assets/out" / f"tall-{år}-W{uke:02d}.json"
    ut.parent.mkdir(parents=True, exist_ok=True)
    ut.write_text(json.dumps({"laget": datetime.now(OSLO).isoformat(timespec="seconds"), "grense": GRENSE.isoformat(),
                              **res}, ensure_ascii=False, indent=1) + "\n")
    print(f"\n{ut}")


def selvtest():
    rader = [
        {"t": "2026-11-13T10:00:00", "type": "video", "skript": "julius.sh", "element": "dag06-1"},
        {"t": "2026-11-13T11:00:00", "type": "video", "skript": "julius.sh", "element": "dag06-1"},
        {"t": "2026-11-13T15:00:00", "type": "video", "skript": "julius.sh", "element": "dag06-2"},
        {"t": "2026-11-13T15:00:00", "type": "video", "skript": "loop.sh", "element": "kontor"},
        {"t": "2026-11-13T15:30:00", "type": "tts", "skript": "rampenissen-tts.sh", "element": "dag-05.mp3", "antall": 2},
    ]
    v = lambda fil, vu, t, **k: {"fil": fil, "hash": "h", "vurdering": vu, "oppdatert": t, **k}
    lager = {"format": 2, "elementer": {
        "video/julius/dag-06.mp4": {"vurderinger": [v("video/julius/dag-06#s1", "godkjent", "2026-11-13T11:30:00Z"),
                                                    v("video/julius/dag-06#s2", "ok", "2026-11-13T14:30:00Z")],
                                    "historikk": [v("video/julius/dag-06#s1", "lag_paa_nytt", "2026-11-13T10:30:00Z")]},
        "audio/rampenissen/dag-05.mp3": {"vurderinger": [v("audio/rampenissen/dag-05.mp3", "godkjent", "2026-11-13T15:00:00Z")],
                                         "historikk": []},
        "manus/radio/dag-05": {"vurderinger": [v("manus/radio/dag-05", "godkjent", "2026-11-13T10:00:00Z",
                                                 kilde="avledet fra godkjent lydklipp")], "historikk": []},
    }}
    manus = {"6": [{"s": 1, "key": ["a", 12, "x"]}, {"s": 2, "key": ["b", 6, "y"]}]}
    r = beregn(rader, lager, manus)
    a, f, e = r["alt"], r["før"], r["etter"]
    assert a["julius"] == {"forsøk": 3, "nok": 51.0, "godkjent": 2, "runder": 3, "elementer": 1,
                           "forsøk_per_godkjent": 1.5, "runder_per_element": 3.0}, a["julius"]
    assert a["_julius"] == {"godkjente_minutter": 0.3, "nok_per_godkjent_minutt": 170.0}
    assert f["julius"]["forsøk"] == 2 and f["julius"]["godkjent"] == 1 and f["julius"]["runder"] == 2  # 11:30Z = 12:30 Oslo
    assert e["julius"]["forsøk"] == 1 and e["julius"]["godkjent"] == 1 and e["tv"]["forsøk"] == 1 and e["tv"]["godkjent"] == 0
    assert e["radio"] == {"forsøk": 2, "nok": 0.2, "godkjent": 1, "runder": 1, "elementer": 1,
                          "forsøk_per_godkjent": 2.0, "runder_per_element": 1.0}
    assert a["manus"]["godkjent"] == 1 and a["manus"]["runder"] == 0  # derived: approved, not a round
    print("selvtest ok")


if __name__ == "__main__":
    if sys.argv[1:2] == ["--selvtest"]:
        selvtest()
    else:
        main(Path(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("MEDIA_DIR") or medie.ROOT / "public"))
