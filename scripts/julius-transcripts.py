#!/usr/bin/env python3
"""Generate src/data/julius_videoer.json from the locked video script.

Transcript = every «Replikk» line of the day, in order.
Run: python3 scripts/julius-transcripts.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/manus/julius-2026.md"
OUT = ROOT / "src/data/julius_videoer.json"

days: dict[int, list[str]] = {}
day = None
for line in SRC.read_text(encoding="utf-8").splitlines():
    if m := re.match(r"^## Dag (\d+)\b", line):
        day = int(m.group(1))
        days[day] = []
    elif line.startswith("## "):
        day = None
    elif day and "**Replikk:**" in line:
        text = line.split("**Replikk:**", 1)[1].strip()
        days[day].append(text[text.index("«") + 1 : text.rindex("»")])

assert len(days) == 24 and all(days.values()), "expected 24 days with lines"
OUT.write_text(
    json.dumps(
        [{"dag": d, "transkripsjon": " ".join(r)} for d, r in sorted(days.items())],
        ensure_ascii=False,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)
print(f"wrote {OUT.relative_to(ROOT)}")
