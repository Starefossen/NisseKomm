#!/usr/bin/env python3
"""Provenance for generated media: what a file was made from, and whether that still holds.

Each generator writes <file>.meta.json next to its output. The status check
recomputes the same inputs from today's sources and compares.

CLI (for the shell generators):
  medie.py tekst rampenissen <dag>        the clip text, as the generator reads it
  medie.py stil rampenissen               the TTS style line
  medie.py skriv <generator> <fil> <kilde> <seksjon|-> <modell> [bilde ...]
  medie.py status <fil>                   prints the status; exit 0 only if ✓ current
  medie.py render <id>                    prompt, base image and refs of a medier.json job, one per line
  medie.py tv                             the TV loops of medier.json, one line each (tv-loops.sh)
  medie.py stiller <id>                   intermediate stills of a job: image|prompt|out, first one first
  medie.py --selvtest
"""
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = ROOT / "assets" / "bin"
JULIUS_MS = "docs/manus/julius-2026.md"
RAMPE_MS = "docs/manus/rampenissen-radio-2026.md"
RAMPE_STYLE = ("Say cheerfully in a sweet, silly, breathless voice with a clear Northern Norwegian (Tromsø) "
               "singsong accent and short giggles:")

CURRENT, STALE, UNKNOWN, MISSING = "current", "stale", "unknown", "missing"

# Files made before sidecars whose source is known to be wrong. Only used while the file has no sidecar.
OVERRIDES = {
    **{f"audio/rampenissen/dag-{d:02d}.mp3": "instruksjonen ble lest opp (laget før sidefiler)" for d in range(1, 5)},
    "video/tv/landsby-winter.mp4": "Winter har nytt design (laget før sidefiler)",
}


def sha(data) -> str:
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def julius_segments(day: int, root: Path = ROOT):
    """[(line, secs, action, kulde)] for one day of the Julius script; [] if the day is missing."""
    text = (root / JULIUS_MS).read_text()
    block = re.search(rf"^## Dag {day} \(.*?(?=^## Dag |\Z)", text, re.S | re.M)
    if not block:
        return []
    return [
        (line.strip(), int(secs), action.strip(), kulde.strip())
        for line, secs, action, kulde in re.findall(
            r"\*\*Replikk:\*\* «(.+?)»\s*\n\s*- Varighet: (\d+) s.*?\n\s*- Handling: (.+?)\n\s*- Kulde: (.+?)\n",
            block.group(0),
            re.S,
        )
    ]


def rampenissen_text(day: int, root: Path = ROOT) -> str:
    """The **Klipp:** lines of one day, same as the old awk/grep/sed pipeline."""
    out, on = [], False
    for line in (root / RAMPE_MS).read_text().splitlines():
        if line.startswith(f"## Dag {day} "):
            on = True
        elif on and line.startswith("## "):
            break
        if on and line.startswith("**Klipp:** «"):
            out.append(re.sub(r"»$", "", line[len("**Klipp:** «"):]))
    return "\n".join(out)


def source_text(path: str, section, root: Path = ROOT):
    """The exact text a generator used from <path> (a day section, or the whole file); None if gone."""
    p = root / path
    if not p.exists():
        return None
    if section is None:  # a template counts as the text it renders to, so moving text into {{…}} changes nothing
        return fill(p.read_text(), root=root)
    day = int(section.split()[-1])
    if path == JULIUS_MS:
        segs = julius_segments(day, root)
        return json.dumps(segs, ensure_ascii=False) if segs else None
    if path == RAMPE_MS:
        return rampenissen_text(day, root) or None
    raise ValueError(f"ukjent seksjonert kilde: {path}")


def prompt_version(generator: str, root: Path = ROOT) -> str:
    """Hash of everything that shapes the prompt besides the source text."""
    parts = {
        "julius-dag.py": ["assets/bin/julius.sh", "assets/characters/julius/beskrivelse.txt"],
        "tv-loops.sh": ["assets/bin/loop.sh", "assets/bin/anchor.sh"],
    }.get(generator)
    if parts is None:
        return sha(RAMPE_STYLE)
    # julius.sh: only the prompt part, above the API call; the post-filter lives in julius-filter.sh
    return sha("".join(((root / p).read_text().split("\ncurl ")[0]) if (root / p).exists() else "" for p in parts))


def filter_version(root: Path = ROOT) -> str:
    m = re.search(r"^FILTER_VERSION=(\d+)", (root / "assets/bin/julius-filter.sh").read_text(), re.M)
    return m.group(1) if m else ""


def file_sha(path: str, root: Path = ROOT):
    p = root / path
    return sha(p.read_bytes()) if p.exists() else None


def rel(p) -> str:
    p = Path(p).resolve()
    return str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p)


def write(generator, out, source, section, model, images=(), root: Path = ROOT, extra=None):
    """Write <out>.meta.json recording the inputs as they are now."""
    if source.startswith(RENDERED):  # record the template, so a changed description marks the file stale
        source = jobs(root)[source.removeprefix(RENDERED).removesuffix(".txt")]["mal"]
    text = source_text(source, section, root)
    if text is None:
        raise ValueError(f"kilden finnes ikke: {source} {section or ''}".strip())
    meta = {
        "generator": generator,
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {"path": source, "section": section, "sha256": sha(text)},
        "reference_images": [{"path": i, "sha256": file_sha(i, root)} for i in images],
        "prompt_version": prompt_version(generator, root),
        "model": model,
        **(extra or {}),
    }
    Path(str(out) + ".meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")


def status(out: Path, key: str = "", root: Path = ROOT):
    """(status, reasons) for one output file. key is its media path, for OVERRIDES."""
    if not out.exists():
        return MISSING, []
    side = Path(str(out) + ".meta.json")
    if not side.exists():
        return (STALE, [OVERRIDES[key]]) if key in OVERRIDES else (UNKNOWN, [])
    m = json.loads(side.read_text())
    s = m["source"]
    why = []
    text = source_text(s["path"], s["section"], root)
    if text is None:
        why.append(f"kilden finnes ikke lenger: {s['path']} {s['section'] or ''}".strip())
    elif sha(text) != s["sha256"]:
        why.append(f"kildeteksten er endret: {s['path']} {s['section'] or ''}".strip())
    why += [f"referansebildet er endret: {i['path']}" for i in m["reference_images"]
            if file_sha(i["path"], root) != i["sha256"]]
    if prompt_version(m["generator"], root) != m["prompt_version"]:
        why.append("promptversjonen er endret")
    return (STALE if why else CURRENT), why


MEDIER = "assets/medier.json"
RENDERED = "assets/out/prompts/"
PLACEHOLDER = re.compile(r"\{\{([\w/.-]+)\}\}")


def jobs(root: Path = ROOT) -> dict:
    return json.loads((root / MEDIER).read_text())


def entity_text(name: str, root: Path = ROOT) -> str:
    """{{stil}} = assets/stil.md, {{objects/x}} = assets/objects/x/beskrivelse.txt, {{winter}} = the one
    characters|locations|objects/winter/beskrivelse.txt; {{iq.KLÆR}} = its line «KLÆR: …» without the label."""
    a = root / "assets"
    if name == "stil":
        return (a / "stil.md").read_text().strip()
    name, _, field = name.partition(".")
    if field:
        m = re.search(rf"^{re.escape(field)}: (.*)$", entity_text(name, root), re.M)
        if not m:
            raise ValueError(f"{{{{{name}.{field}}}}}: ingen linje «{field}:»")
        return m[1].strip()
    hits = [a / name / "beskrivelse.txt"] if "/" in name else \
        [a / k / name / "beskrivelse.txt" for k in ("characters", "locations", "objects")]
    hits = [h for h in hits if h.exists()]
    if len(hits) != 1:
        raise ValueError(f"{{{{{name}}}}}: {'ingen' if not hits else 'flere'} beskrivelse.txt")
    return hits[0].read_text().strip()


def fill(text: str, root: Path = ROOT) -> str:
    return PLACEHOLDER.sub(lambda m: entity_text(m[1], root), text)


def image(spec: str, root: Path = ROOT) -> str:
    """'characters/winter#tophat' -> refs.tophat in its entitet.json, else ref-tophat.jpg; a plain path is kept."""
    if "#" not in spec:
        return spec
    ent, var = spec.split("#")
    meta = root / "assets" / ent / "entitet.json"
    refs = json.loads(meta.read_text()).get("refs", {}) if meta.exists() else {}
    return f"assets/{ent}/{refs.get(var, f'ref-{var}.jpg')}"


def render(job_id: str, root: Path = ROOT, table=None):
    """(prompt, image, refs) of one medier.json job, relative to root. A template with placeholders is
    written filled to assets/out/prompts/<id>.txt for the shell generators; write() maps it back."""
    table = table or jobs(root)
    j = table[job_id]
    prompt = j.get("mal")
    if prompt:
        text = (root / prompt).read_text()
        filled = fill(text, root)
        if filled != text:
            prompt = f"{RENDERED}{job_id}.txt"
            (root / prompt).parent.mkdir(parents=True, exist_ok=True)
            (root / prompt).write_text(filled)
    img = j.get("bilde")
    img = table[img]["ut"] if img in table else img and image(img, root)  # an intermediate still: its output
    return prompt, img, [image(r, root) for r in j.get("refs", [])]


def stills(job_id: str, root: Path = ROOT, table=None):
    """[(image, prompt, out)] intermediate stills a job's base image is made from, first one first."""
    table = table or jobs(root)
    out, b = [], table[job_id].get("bilde")
    while b in table:
        prompt, img, _ = render(b, root, table)
        out.insert(0, (img, prompt, table[b]["ut"]))
        b = table[b].get("bilde")
    return out


def tv_lines(root: Path = ROOT):
    """One line per TV loop for tv-loops.sh: name|prompt|image|state|anchor|refs (absolute, refs space-separated)."""
    table = jobs(root)
    for k, j in table.items():
        if j["generator"] == "loop":
            prompt, img, refs = render(k, root, table)
            yield "|".join([k.split("/", 1)[1], str(root / prompt), str(root / img) if img else "",
                            j.get("tilstand", ""), "1" if j.get("anker") else "", " ".join(str(root / r) for r in refs)])


def selftest():
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        r = Path(d)
        for f, t in {"assets/stil.md": "STIL\n",
                     "assets/characters/winter/beskrivelse.txt": "KARAKTER: lang mann\nKLÆR: hatt \n",
                     "assets/characters/winter/entitet.json": '{"refs": {"tophat": "ref-v1-tophat.jpg"}}',
                     "assets/objects/postkasse/beskrivelse.txt": "rød kasse",
                     "assets/locations/torg/beskrivelse.txt": "torg",
                     "assets/locations/winter/beskrivelse.txt": "dobbel",
                     "p/a.txt": "{{characters/winter.KARAKTER}} ved {{objects/postkasse}}, {{characters/winter.KLÆR}}. {{stil}}",
                     "p/b.txt": "uten plassholdere", "p/c.txt": "{{torg}}", "p/d.txt": "{{winter}}"}.items():
            (r / f).parent.mkdir(parents=True, exist_ok=True)
            (r / f).write_text(t)
        t = {"a": {"mal": "p/a.txt", "bilde": "locations/torg#rolig",
                   "refs": ["characters/winter#tophat", "assets/x.jpg"]},
             "b": {"mal": "p/b.txt"}, "c": {"mal": "p/c.txt"}, "d": {"mal": "p/d.txt"}}
        prompt, img, refs = render("a", r, t)
        assert prompt == "assets/out/prompts/a.txt"
        assert (r / prompt).read_text() == "lang mann ved rød kasse, hatt. STIL", (r / prompt).read_text()
        assert img == "assets/locations/torg/ref-rolig.jpg"
        assert refs == ["assets/characters/winter/ref-v1-tophat.jpg", "assets/x.jpg"]
        assert render("b", r, t) == ("p/b.txt", None, [])  # unchanged text keeps the tracked path
        assert (r / render("c", r, t)[0]).read_text() == "torg"  # bare name, one hit
        t |= {"s1": {"ut": "o/s1.jpg", "bilde": "assets/base.jpg", "mal": "p/b.txt"},
              "s2": {"ut": "o/s2.jpg", "bilde": "s1", "mal": "p/b.txt"}, "e": {"bilde": "s2", "mal": "p/b.txt"}}
        assert render("e", r, t)[1] == "o/s2.jpg"  # base image is an intermediate still
        assert stills("e", r, t) == [("assets/base.jpg", "p/b.txt", "o/s1.jpg"), ("o/s1.jpg", "p/b.txt", "o/s2.jpg")]
        # sidecars: a file made from the rendered prompt records the template; the description drives its status
        (r / MEDIER).write_text(json.dumps(t))
        (r / "ut.jpg").write_text("x")
        write("still.sh", r / "ut.jpg", prompt, None, "m", root=r)
        assert json.loads((r / "ut.jpg.meta.json").read_text())["source"]["path"] == "p/a.txt"
        assert status(r / "ut.jpg", root=r)[0] == CURRENT
        (r / "p/a.txt").write_text("{{characters/winter.KARAKTER}} ved rød kasse, {{characters/winter.KLÆR}}. STIL")
        assert status(r / "ut.jpg", root=r)[0] == CURRENT  # same rendered text, still current
        (r / "assets/characters/winter/beskrivelse.txt").write_text("KARAKTER: kort mann\nKLÆR: hatt\n")
        assert status(r / "ut.jpg", root=r)[0] == STALE
        for bad in (lambda: render("d", r, t), lambda: fill("{{ukjent}}", r),  # ambiguous, unknown
                    lambda: fill("{{winter.SKO}}", r)):  # missing field
            try:
                bad()
                raise AssertionError("plassholderen ble godtatt")
            except ValueError:
                pass
    print("selvtest ok")


def main(argv):
    if not argv:
        print(__doc__)
        sys.exit(2)
    cmd, args = argv[0], argv[1:]
    if cmd == "tekst":
        print(rampenissen_text(int(args[1])))
    elif cmd == "stil":
        print(RAMPE_STYLE)
    elif cmd == "skriv":
        gen, out, src, section, model, *images = args
        write(gen, out, rel(src), None if section == "-" else section, model, [rel(i) for i in images])
    elif cmd == "render":
        prompt, img, refs = render(args[0])
        print(*(str(ROOT / p) for p in (prompt, img, *refs) if p), sep="\n")
    elif cmd == "tv":
        print(*tv_lines(), sep="\n")
    elif cmd == "stiller":
        print(*("|".join(str(ROOT / p) for p in s) for s in stills(args[0])), sep="\n")
    elif cmd == "--selvtest":
        selftest()
    elif cmd == "status":
        out = Path(args[0]).resolve()
        key = rel(out).removeprefix("public/")
        st, why = status(out, key)
        print(st, *why, sep="\n  ")
        sys.exit(0 if st == CURRENT else 1)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
