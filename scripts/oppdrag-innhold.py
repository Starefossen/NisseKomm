#!/usr/bin/env python3
"""Write days 2-24 from the locked app texts into src/data.

Source: docs/manus/app-tekster-2026.md (section A and B). Day 1 is left alone
(its section may still change). Codes, symbols and challenge sequences are
never touched. Safe to re-run.

Run: python3 scripts/oppdrag-innhold.py [--check]
--check writes nothing and exits 1 if src/data differs from the manus.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src/data"
DOC = (ROOT / "docs/manus/app-tekster-2026.md").read_text(encoding="utf-8")
CHECK = "--check" in sys.argv
STALE = []


def write(p, text):
    # Format like `pnpm check` does, so a re-run on an unchanged manus is a no-op.
    text = subprocess.run(
        ["npx", "--no-install", "prettier", "--stdin-filepath", str(p)],
        input=text, capture_output=True, text=True, check=True, cwd=ROOT,
    ).stdout
    if p.read_text(encoding="utf-8") == text:
        return
    if CHECK:
        STALE.append(str(p.relative_to(ROOT)))
    else:
        p.write_text(text, encoding="utf-8")


DAYS = range(2, 25)
EVENTYR_ID = "spokelseskoden"

# Emoji render in colour on iPad Safari. A lone ❄ (a frost square in the setup
# notes) becomes ✱; other emoji are dropped with one adjacent space.
EMOJI = "[❄🏅⚠📋📖🛠❌⏳🏆ℹ⭐💡🖨✝📝📍🎯🎅📊🎉🎁🔐📅➕🔑🚪🔒✨✅📦🔓🔴⏰🎄🧝⚙🦌🔧⚡🕊🚨💥🌟💚🔮🧪📺📡🎵🕯📓🛷🍬🥶😶🌙❤]\uFE0F?"


def no_emoji(text, frost=False):
    if frost:
        text = re.sub("❄(?!\uFE0F)", "✱", text)
    text = re.sub(r'(["`>]\s*)' + EMOJI + " ", r"\1", text)
    return re.sub(" ?" + EMOJI, "", text)


def section(day):
    m = re.search(rf"^### Dag {day} \(.*?$(.*?)(?=^### Dag |^---$)", DOC, re.S | re.M)
    return m.group(1)


def field(sec, name):
    m = re.search(rf"^- `{re.escape(name)}`(?: \([^)]*\))?: (.*)$", sec, re.M)
    return m.group(1).strip() if m else None


def strip_note(t):
    # "Lampene som Lyver (ny: ...)" -> "Lampene som Lyver"
    return re.sub(r"\s*\((gammel|ny|uten)\b.*\)$", "", t)


def quote_block(sec, path):
    m = re.search(re.escape(f"`{path}`") + r".*?\n\n((?:  >[^\n]*\n)+)", sec, re.S)
    lines = [l[4:] if l.startswith("  > ") else "" for l in m.group(1).rstrip("\n").split("\n")]
    lines = [l.replace(" (vises i tegnsettet)", "") for l in lines if l != "```"]
    return "\n".join(lines).strip()


days = {}
for d in DAYS:
    s = section(d)
    days[d] = dict(
        sec=s,
        tittel=strip_note(field(s, "tittel")),
        nissemail_tekst=field(s, "nissemail_tekst"),
        julius_ps=field(s, "julius_ps"),
        julius_ps_bonus=field(s, "julius_ps_bonus"),
        julius_ps_krypto_mangler=field(s, "julius_ps_krypto_mangler"),
        alerts=field(s, "daily_alerts").split(" · "),
        symbol=field(s, "symbol_clue.description"),
        rampestrek=field(s, "rampenissen_rampestrek"),
        fysisk_hint=field(s, "fysisk_hint"),
        materialer=[x.strip().strip("`") for x in field(s, "materialer_nødvendig").split("·")],
    )

# --- A4 bonus, A5 decryption ---
a4 = re.search(r"^### A4\..*?(?=^### A5)", DOC, re.S | re.M).group(0)


def bonus(day):
    b = re.search(rf"\*\*Dag {day}\*\*.*?\n\n((?:- .*\n)+)", a4, re.S).group(1)
    get = lambda k: re.search(rf"^- `{k}`: (.*)$", b, re.M).group(1).strip()
    kode = re.search(r"`foreldre_kode`: `(\w+)`", b).group(1)
    return {
        "tittel": get("tittel"),
        "beskrivelse": get("beskrivelse"),
        "fysisk_oppgave": get("fysisk_oppgave"),
        "validering": "forelder",
        "foreldre_kode": kode,
        "frost_effekt": -20,
        "belønning_tekst": get("belønning_tekst"),
    }


crypto = {}
for row in re.findall(r"^\| (\d+) +\| `([\w-]+)` +\| (.*?) +\| (.*?) +\|$", DOC, re.M):
    crypto[int(row[0])] = {"hint": row[2], "rewardText": row[3]}

# --- NisseNet: new/rewritten files per day (folder path, name, day, afterDay) ---
NEW_FILES = [
    (["SNOFALL-HISTORIER", "IQ-VERKSTED"], "feilrapport-uke-1.txt", 8, "IQ-VERKSTED/feilrapport-uke-1.txt", 8),
    (["SNOFALL-HISTORIER"], "krystallformel.txt", 9, "SNOFALL-HISTORIER/krystallformel.txt", 9),
    (["SNOFALL-HISTORIER"], "farge-koder.txt", 10, "SNOFALL-HISTORIER/farge-koder.txt", 10),
    (["FARGESAMLEREN"], "01-fargene.txt", 10, "FARGESAMLEREN/01-fargene.txt", 10),
    (["SNOFALL-HISTORIER"], "antennen-ved-tjernet.txt", 11, "SNOFALL-HISTORIER/antennen-ved-tjernet.txt", 11),
    (["DEKRYPTERT"], "frosne-koder.txt", 12, "DEKRYPTERT/frosne-koder.txt", None),
    (["SNOFALL-HISTORIER"], "lucia-tradisjon.txt", 13, "SNOFALL-HISTORIER/lucia-tradisjon.txt", 13),
    (["SNOFALL-HISTORIER"], "brevfugl-historie.txt", 14, "brevfugl-historie.txt", 14),
    (["FARGESAMLEREN"], "02-notatboken.txt", 15, "FARGESAMLEREN/02-notatboken.txt", 15),
    (["DEKRYPTERT"], "stjernetegn.txt", 18, "DEKRYPTERT/stjernetegn.txt", None),
    (["SNOFALL-HISTORIER", "IQ-VERKSTED"], "foringsautomat.log", 19, "IQ-VERKSTED/foringsautomat.log", 19),
    (["JULIUS-ARKIV"], "snill-listen.txt", 22, "JULIUS-ARKIV/snill-listen.txt", 22),
    (["DEKRYPTERT"], "hjertets-hemmelighet.txt", 23, "DEKRYPTERT/hjertets-hemmelighet.txt", None),
    (["FARGESAMLEREN"], "03-siste-side.txt", 23, "FARGESAMLEREN/03-siste-side.txt", 23),
]
DECRYPTED = {"frosne-koder.txt", "stjernetegn.txt", "hjertets-hemmelighet.txt"}
# Section D: deleted, plus the old names of replaced files
DELETE = {
    "hint_arkiv.txt", "hemmelig_kode.txt", "snowflake-patterns.txt", "dekoder_reinsdyr.txt",
    "julekuleblasing.txt", "farge_system_dekoder.txt", "tidsanomalier.txt", "antenna-crisis.txt",
    "antenne_tid_system.txt", "julesanger-samling.txt", "lucia_lussekatt_hemmelig.txt",
    "personlige-brev-intro.txt", "halvveis_system.txt", "julekode_dekoder.txt",
    "nordpolen_hemmelighet.txt", "snofall_fakta.txt", "magisk-sekk-test.txt",
    "brevfugl-finale.txt", "fargesamleren.txt", "reinsdyr_GYATT.log", "snill_slem_liste.txt",
}

# --- quests ---
for f in ("uke1", "uke2", "uke3", "uke4"):
    p = DATA / f"{f}_oppdrag.json"
    quests = json.loads(p.read_text(encoding="utf-8"))
    for q in quests:
        d = q["dag"]
        q["eventyr"] = {"id": EVENTYR_ID, "phase": d}
        if d not in days:
            continue
        x = days[d]
        q["tittel"] = x["tittel"]
        q["nissemail_tekst"] = x["nissemail_tekst"]
        q["julius_ps"] = x["julius_ps"]
        for k in ("julius_ps_bonus", "julius_ps_krypto_mangler"):
            if x[k]:
                q[k] = x[k]
        q["rampenissen_rampestrek"] = x["rampestrek"]
        q["fysisk_hint"] = x["fysisk_hint"]
        q["materialer_nødvendig"] = x["materialer"]
        if x["symbol"]:
            q["symbol_clue"]["description"] = x["symbol"]
        for k in ("hint", "hint_type", "dagbokinnlegg"):
            q.pop(k, None)
        if "bonusoppdrag" in q:
            q["bonusoppdrag"] = bonus(d)
        if "decryption_challenge" in q:
            q["decryption_challenge"].update(crypto[d])
        rev = q.setdefault("reveals", {})
        rev.pop("topics", None)
        new = [n for (_, n, fd, _, _) in NEW_FILES if fd == d and n not in DECRYPTED]
        rev["files"] = new if d >= 8 else [fn for fn in rev.get("files", []) if fn not in DELETE]
        mods = rev.setdefault("modules", [])
        # Snøfall TV is open from day 1; a day-10 unlock does nothing
        if "SNØFALL_TV" in mods:
            mods.remove("SNØFALL_TV")
        if d == 3 and "SYMBOLSKANNER" not in mods:
            mods.append("SYMBOLSKANNER")
    write(p, no_emoji(json.dumps(quests, ensure_ascii=False, indent=2), frost=True) + "\n")

# --- statisk_innhold ---
p = DATA / "statisk_innhold.json"
s = json.loads(p.read_text(encoding="utf-8"))

# Alerts that give away the day's outcome wait for the code.
SPOILERS = ("Muren holder", "Frostgrad 0 %", "Brevet har tint")
old = s["daily_alerts"]
alerts = [a for a in old if a["day"] not in days]
for d in DAYS:
    prev = [a for a in old if a["day"] == d]
    for i, t in enumerate(days[d]["alerts"]):
        a = {"day": d, "tekst": t, "type": prev[i]["type"] if i < len(prev) else "info"}
        if d == 7 or any(w in t for w in SPOILERS):
            a["etterKode"] = True  # A7 and spoilers: shown only once the day is solved
        alerts.append(a)
s["daily_alerts"] = sorted(alerts, key=lambda a: a["day"])


def prune(nodes):
    out = []
    for n in nodes:
        if n["navn"] in DELETE:
            continue
        if "barn" in n:
            n["barn"] = prune(n["barn"])
        out.append(n)
    return out


def folder(path):
    nodes = s["filer"]
    for name in path:
        hit = next((n for n in nodes if n["navn"] == name), None)
        if not hit:
            hit = {"navn": name, "type": "mappe", "barn": []}
            nodes.append(hit)
        nodes = hit["barn"]
    return nodes


s["filer"] = prune(s["filer"])
for path, name, d, doc_path, after in NEW_FILES:
    node = {"navn": name, "type": "fil", "innhold": quote_block(days[d]["sec"], doc_path)}
    node["unlockConditions"] = (
        {"afterDay": after} if after else {"requiresSolvedDecryption": name.removesuffix(".txt")}
    )
    siblings = folder(path)
    i = next((i for i, n in enumerate(siblings) if n["navn"] == name), None)
    if i is None:
        siblings.append(node)
    else:
        siblings[i] = node

write(p, no_emoji(json.dumps(s, ensure_ascii=False, indent=2)) + "\n")
if CHECK:
    sys.exit(f"Ute av synk med manus: {', '.join(STALE)}" if STALE else 0)
for d in DAYS:
    print(d, days[d]["tittel"])
