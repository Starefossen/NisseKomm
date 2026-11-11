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
  medie.py brukt-av <entitet>             medier.json jobs that use winter, torget, objects/postkasse …
  medie.py flytt                        move gitignored refs and stills to their new paths (assets/flyttet.json)
  medie.py tv                           the TV loops of medier.json, one line each (tv-loops.sh)
  medie.py stiller <id>                   intermediate stills of a job: image|prompt|out|refs, first one first
  medie.py inndata                        every job's template, image, refs exist; exit 1 if one is missing
  medie.py entiteter [--sjekk]            src/data/entiteter.json + CONTENT_GUIDE block from characters/*/entitet.md
  medie.py --selvtest
"""
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# NISSEKOMM_ROOT: use another checkout's assets (a dry run from a worktree against the real refs)
ROOT = Path(os.environ.get("NISSEKOMM_ROOT") or Path(__file__).resolve().parents[2]).resolve()
BIN = ROOT / "assets" / "bin"
JULIUS_MS = "docs/manus/julius-2026.md"
RAMPE_MS = "docs/manus/rampenissen-radio-2026.md"


def entity(ent: str, root: Path = ROOT) -> dict:
    """assets/<kind>/<id>/entitet.md: its ```json block, plus each «## Overskrift» section under "seksjoner"."""
    p = root / "assets" / ent / "entitet.md"
    if not p.exists():
        return {}
    t = p.read_text()
    meta = json.loads(re.search(r"```json\n(.*?)\n```", t, re.S)[1])
    parts = re.split(r"^## (.+)$", t, flags=re.M)
    meta["seksjoner"] = {h.strip(): b.strip() for h, b in zip(parts[1::2], parts[2::2])}
    return meta


# the TTS line in Rampenissen's «## Stemme»; a changed line marks every clip stale (prompt_version)
RAMPE_STYLE = re.search(r"^TTS: (.+)$", entity("characters/rampenissen")["seksjoner"]["Stemme"], re.M)[1]

CURRENT, STALE, UNKNOWN, MISSING = "current", "stale", "unknown", "missing"

# Files made before sidecars whose source is known to be wrong. Only used while the file has no sidecar.
OVERRIDES = {
    **{f"audio/rampenissen/dag-{d:02d}.mp3": "instruksjonen ble lest opp (laget før sidefiler)" for d in range(1, 5)},
    "video/tv/landsby-winter.mp4": "Winter har nytt design (laget før sidefiler)",
}


def sha(data) -> str:
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def julius_segments(day: int, root: Path = ROOT):
    """[(line, secs, action, kulde, locked)] for one day of the Julius script; [] if the day is missing.

    Tolerant of field order and missing fields (the script is rewritten by hand): a segment is a
    **Replikk:** «…» followed by «- Varighet: N s», «- Handling:», «- Kulde:» lines. locked = the
    segment is marked as a locked brikke («låst» or «brikke» on the Varighet line or after the line)."""
    text = (root / JULIUS_MS).read_text()
    block = re.search(rf"^## Dag {day} \(.*?(?=^## Dag |\Z)", text, re.S | re.M)
    if not block:
        return []
    out = []
    for seg in re.split(r"\*\*Replikk:\*\*", block.group(0))[1:]:
        line = re.match(r"\s*«(.+?)»(.*)", seg, re.S)
        secs = re.search(r"^\s*- Varighet: (\d+) s(.*)$", seg, re.M)
        if not line or not secs:
            continue
        field = lambda k: (m.group(1).strip() if (m := re.search(rf"^\s*- {k}: (.+)$", seg, re.M)) else "")
        tag = (line.group(2).split("\n")[0] + secs.group(2)).lower()
        out.append((line.group(1).strip(), int(secs.group(1)), field("Handling"), field("Kulde"),
                    "låst" in tag or "brikke" in tag))
    return out


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


FLYTTET = "assets/flyttet.json"  # old -> new path of moved prompts, stills and refs


def moves(root: Path = ROOT) -> dict:
    return json.loads((root / FLYTTET).read_text()) if (root / FLYTTET).exists() else {}


def located(path: str, root: Path = ROOT) -> Path:
    """Where a path recorded in a sidecar is now. Sidecars keep their old paths (also absolute ones from
    another checkout); a file that has moved is found through assets/flyttet.json, so no sidecar is rewritten."""
    p = root / path
    if p.exists():
        return p
    i = str(path).find("assets/")
    key = str(path)[i:] if i >= 0 else str(path)
    return root / moves(root)[key] if key in moves(root) else p


def flytt(root: Path = ROOT):
    """Move every file in flyttet.json that is still at its old place (gitignored refs and stills; idempotent)."""
    for old, new in moves(root).items():
        o, n = root / old, root / new
        if o.exists() and not n.exists():
            n.parent.mkdir(parents=True, exist_ok=True)
            o.rename(n)
            print(f"{old} -> {new}")


def source_text(path: str, section, root: Path = ROOT):
    """The exact text a generator used from <path> (a day section, or the whole file); None if gone."""
    p = located(path, root)
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
    p = located(path, root)
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
    """{{stil}} = assets/stil.md, {{prompts/x/y}} = assets/prompts/x/y.txt, {{objects/x}} = assets/objects/x/
    beskrivelse.txt, {{winter}} = the one characters|locations|objects/winter/beskrivelse.txt;
    {{iq.KLÆR}} = its line «KLÆR: …» without the label."""
    a = root / "assets"
    if name == "stil":
        return (a / "stil.md").read_text().strip()
    if name.startswith("prompts/"):  # {{prompts/spill/piksel-stil}}: a block shared by several templates
        return (a / f"{name}.txt").read_text().strip()
    name, _, field = name.partition(".")
    if field:
        m = re.search(rf"^{re.escape(field)}: (.*)$", entity_text(name, root), re.M)
        if not m:  # {{winter.personlighet}}: a section of entitet.md
            ent = name if "/" in name else next((f"{k}/{name}" for k in ("characters", "locations", "objects")
                                                 if (root / "assets" / k / name).is_dir()), name)
            sec = {h.lower(): b for h, b in entity(ent, root).get("seksjoner", {}).items()}
            if field.lower() in sec:
                return sec[field.lower()]
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
    """'characters/winter#tophat' -> refs.tophat in its entitet.md, else ref-tophat.jpg; a plain path is kept."""
    if "#" not in spec:
        return spec
    ent, var = spec.split("#")
    refs = entity(ent, root).get("refs", {})
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
        prompt, img, refs = render(b, root, table)  # refs (a character) are fine for the image model
        out.insert(0, (img, prompt, table[b]["ut"], *refs))
        b = table[b].get("bilde")
    return out


def missing_inputs(root: Path = ROOT, table=None):
    """(missing, skipped) inputs of every medier.json job: template, base image, refs, state loop.
    An absent image that git does not track (gitignored refs in CI) is skipped, not missing."""
    table = table or jobs(root)
    outs = {j["ut"] for j in table.values() if "ut" in j}
    missing, skipped = [], []
    for k, j in table.items():
        if j.get("generator") == "hånd":
            continue
        if j.get("tilstand") and f"tv/{j['tilstand']}" not in table:
            missing.append(f"{k}: tilstand {j['tilstand']}")
        try:
            prompt, img, refs = render(k, root, table)
        except (ValueError, KeyError, OSError) as e:
            missing.append(f"{k}: {e}")
            continue
        if prompt and not (root / prompt).exists():
            missing.append(f"{k}: {prompt}")
        for f in ([img] if img else []) + refs:
            if f in outs or (root / f).exists():
                continue
            tracked = subprocess.run(["git", "-C", str(root), "ls-files", "--error-unmatch", f],
                                     capture_output=True).returncode == 0
            (missing if tracked else skipped).append(f"{k}: {f}")
    return missing, skipped


def used_by(entity: str, root: Path = ROOT, table=None):
    """medier.json jobs that use an entity (winter, objects/postkasse …): as place, image, ref or in the template."""
    table = table or jobs(root)
    seg = f"/{entity.rsplit('/', 1)[-1]}"
    hits = []
    for k, j in table.items():
        paths = [j.get("bilde") or "", *j.get("refs", [])]
        text = (root / j["mal"]).read_text() if j.get("mal") and (root / j["mal"]).exists() else ""
        if j.get("sted") == entity or any(f"{seg}#" in p or f"{seg}/" in p for p in paths) \
                or re.search(rf"\{{\{{(\w+/)?{re.escape(entity.rsplit('/', 1)[-1])}[}}.]", text):
            hits.append(k)
    return hits


def anchor(a, root: Path = ROOT) -> str:
    """'anker': true -> "1" (anchor to the job's own image); a ref spec -> that image, absolute (e.g. a closed
    gate the clip of the open gate fades from and back to)."""
    return "" if not a else "1" if a is True else str(root / image(a, root))


def tv_lines(root: Path = ROOT):
    """One line per TV loop for tv-loops.sh: name|prompt|image|state|anchor|refs|first_only (absolute, refs space-separated)."""
    table = jobs(root)
    for k, j in table.items():
        if j["generator"] == "loop":
            prompt, img, refs = render(k, root, table)
            yield "|".join([k.split("/", 1)[1], str(root / prompt), str(root / img) if img else "",
                            j.get("tilstand", ""), anchor(j.get("anker"), root), " ".join(str(root / r) for r in refs),
                            "1" if j.get("bare_forste") else ""])


FIXTURE = "src/data/entiteter.json"
GUIDE = "CONTENT_GUIDE.md"
MARK = ("<!-- entiteter:start (mise run entiteter) -->", "<!-- entiteter:slutt -->")


def characters(root: Path = ROOT):
    return [entity(f"characters/{p.name}", root) for p in sorted((root / "assets/characters").iterdir())
            if (p / "entitet.md").exists()]


def entiteter(root: Path = ROOT):
    """(fixture JSON for entiteter.test.ts, CONTENT_GUIDE block), both from characters/*/entitet.md."""
    cs = characters(root)
    fx = [{k: c[k] for k in ("id", "navn", "pronomen", "fra_dag", "ikke")} for c in cs]
    lines = [MARK[0], "", "Generated from `assets/characters/<id>/entitet.md`, the one source for look, personality, "
             "voice, relations and facts. Edit there, then run `mise run entiteter`.", ""]
    for c in cs:
        sek = c["seksjoner"]
        voice = sek["Stemme"].split("\n\nTTS:")[0]; voice = " ".join(voice.split())
        lines += [f"#### {c['navn'][0]} (`assets/characters/{c['id']}/entitet.md`)", "",
                  f"- **Navn:** {', '.join(c['navn'])}; **pronomen:** {c['pronomen']}; **fra dag:** {c['fra_dag']}",
                  f"- **Personlighet:** {sek['Personlighet']}",
                  f"- **Stemme:** {voice}",
                  f"- **Forhold:** {'; '.join(f'{k}: {v}' for k, v in c['forhold'].items())}",
                  f"- **Aldri:** {', '.join(f'«{x}»' for x in c['ikke'])}", ""]
    return json.dumps(fx, ensure_ascii=False, indent=2) + "\n", "\n".join(lines + [MARK[1]])


def write_entiteter(root: Path = ROOT, check=False) -> bool:
    """Write the fixture and the CONTENT_GUIDE block; with check, only report whether they are current."""
    fx, blk = entiteter(root)
    g = (root / GUIDE).read_text()
    i, j = g.index(MARK[0]), g.index(MARK[1]) + len(MARK[1])
    new_g = g[:i] + blk + g[j:]
    f = root / FIXTURE
    ok = f.exists() and json.loads(f.read_text()) == json.loads(fx) and new_g == g  # prettier may reflow the JSON
    if not check:
        f.write_text(fx)
        (root / GUIDE).write_text(new_g)
    return ok


def selftest():
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        r = Path(d)
        (r / JULIUS_MS).parent.mkdir(parents=True, exist_ok=True)
        (r / JULIUS_MS).write_text("## Dag 3 (x)\n1. **Replikk:** «Hei.»\n   - Varighet: 13 s (2 ord)\n   - Handling: Vinker.\n"
                                   "   - Kulde: Svak knitring.\n2. **Replikk:** «Brikke her.» (låst)\n   - Varighet: 15 s\n"
                                   "   - Kulde: Fargene renner ut.\n## Dag 4 (y)\n")
        assert julius_segments(3, r) == [("Hei.", 13, "Vinker.", "Svak knitring.", False),
                                         ("Brikke her.", 15, "", "Fargene renner ut.", True)], julius_segments(3, r)
        assert julius_segments(4, r) == []
        for f, t in {"assets/stil.md": "STIL\n",
                     "assets/characters/winter/beskrivelse.txt": "KARAKTER: lang mann\nKLÆR: hatt \n",
                     "assets/characters/winter/entitet.md":
                         '# W\n```json\n{"refs": {"tophat": "ref-v1-tophat.jpg"}}\n```\n## Personlighet\nordentlig\n',
                     "assets/objects/postkasse/beskrivelse.txt": "rød kasse",
                     "assets/locations/torg/beskrivelse.txt": "torg",
                     "assets/locations/winter/beskrivelse.txt": "dobbel",
                     "p/a.txt": "{{characters/winter.KARAKTER}} ved {{objects/postkasse}}, {{characters/winter.KLÆR}}. {{stil}}",
                     "p/b.txt": "uten plassholdere", "p/c.txt": "{{torg}}", "p/d.txt": "{{winter}}",
                     "assets/prompts/x/felles.txt": "FELLES\n", "p/f.txt": "{{prompts/x/felles}} her"}.items():
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
        assert fill("{{characters/winter.personlighet}}", r) == "ordentlig"  # a section of entitet.md
        assert fill((r / "p/f.txt").read_text(), r) == "FELLES her"  # a shared prompt block
        t |= {"s1": {"ut": "o/s1.jpg", "bilde": "assets/base.jpg", "mal": "p/b.txt"},
              "s2": {"ut": "o/s2.jpg", "bilde": "s1", "mal": "p/b.txt"}, "e": {"bilde": "s2", "mal": "p/b.txt"}}
        assert render("e", r, t)[1] == "o/s2.jpg"  # base image is an intermediate still
        assert used_by("winter", r, t) == ["a", "d"] and used_by("objects/postkasse", r, t) == ["a"]
        assert used_by("torg", r, t) == ["a", "c"]  # image locations/torg#rolig, template {{torg}}
        assert stills("e", r, t) == [("assets/base.jpg", "p/b.txt", "o/s1.jpg"), ("o/s1.jpg", "p/b.txt", "o/s2.jpg")]
        # sidecars: a file made from the rendered prompt records the template; the description drives its status
        (r / MEDIER).write_text(json.dumps(t))
        (r / "ut.jpg").write_text("x")
        write("still.sh", r / "ut.jpg", prompt, None, "m", root=r)
        assert json.loads((r / "ut.jpg.meta.json").read_text())["source"]["path"] == "p/a.txt"
        assert status(r / "ut.jpg", root=r)[0] == CURRENT
        (r / "p/a.txt").write_text("{{characters/winter.KARAKTER}} ved rød kasse, {{characters/winter.KLÆR}}. STIL")
        assert status(r / "ut.jpg", root=r)[0] == CURRENT  # same rendered text, still current
        # moves: the sidecar keeps the old path, flyttet.json finds the new one
        (r / FLYTTET).write_text(json.dumps({"p/a.txt": "q/a.txt", "assets/gml.jpg": "assets/ny.jpg"}))
        flytt(r)
        flytt(r)  # idempotent
        assert (r / "q/a.txt").exists() and not (r / "p/a.txt").exists()
        assert status(r / "ut.jpg", root=r)[0] == CURRENT
        (r / "assets/ny.jpg").write_text("x")
        assert located("/en/annen/sjekkut/assets/gml.jpg", r) == r / "assets/ny.jpg"
        (r / "p/a.txt").parent.mkdir(exist_ok=True)
        (r / "q/a.txt").rename(r / "p/a.txt")
        (r / "assets/characters/winter/beskrivelse.txt").write_text("KARAKTER: kort mann\nKLÆR: hatt\n")
        assert status(r / "ut.jpg", root=r)[0] == STALE
        for bad in (lambda: render("d", r, t), lambda: fill("{{ukjent}}", r),  # ambiguous, unknown
                    lambda: fill("{{winter.SKO}}", r)):  # missing field
            try:
                bad()
                raise AssertionError("plassholderen ble godtatt")
            except ValueError:
                pass
        mi = missing_inputs(r, {"m": {"mal": "p/borte.txt", "tilstand": "nei"},
                                "n": {"mal": "p/b.txt", "bilde": "assets/x.jpg"}})
        assert mi[0][0] == "m: tilstand nei" and "borte.txt" in mi[0][1] and len(mi[0]) == 2, mi
        assert mi[1] == ["n: assets/x.jpg"], mi  # untracked image: skipped
    missing, skipped = missing_inputs()  # the real medier.json
    assert not missing, missing
    print(f"selvtest ok (inndata: {len(skipped)} bilder utenfor git hoppet over)")


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
    elif cmd == "brukt-av":
        print(*used_by(args[0]), sep="\n")
    elif cmd == "flytt":
        flytt()
    elif cmd == "tv":
        for line in tv_lines():
            print(line)
    elif cmd == "stiller":
        # print(*[], sep="\n") would emit one empty line, which tv-loops.sh read as a still with no inputs
        for s in stills(args[0]):
            print("|".join([*(str(ROOT / p) for p in s[:3]), " ".join(str(ROOT / p) for p in s[3:])]))
    elif cmd == "inndata":
        missing, skipped = missing_inputs()
        for m in skipped:
            print(f"hoppet over (ikke i git): {m}")
        for m in missing:
            print(f"mangler: {m}")
        sys.exit(1 if missing else 0)
    elif cmd == "entiteter":
        ok = write_entiteter(check="--sjekk" in args)
        if "--sjekk" in args and not ok:
            sys.exit(f"{FIXTURE} eller blokken i {GUIDE} er utdatert: kjør mise run entiteter")
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
