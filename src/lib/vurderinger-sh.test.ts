/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// scripts/vurderinger.sh with a fake curl: which runs move the --nye marker.
function kjør(args: string[]) {
  const d = mkdtempSync(path.join(tmpdir(), "vurd-sh-"));
  const curl = path.join(d, "curl");
  writeFileSync(
    curl,
    `#!/bin/sh\necho 'data: {"result":{"content":[{"text":"ok"}]}}'\n`,
  );
  chmodSync(curl, 0o755);
  execFileSync("bash", ["scripts/vurderinger.sh", ...args], {
    env: {
      ...process.env,
      PATH: `${d}:${process.env.PATH}`,
      XDG_CACHE_HOME: d,
      HOME: d,
    },
  });
  return existsSync(path.join(d, "nissekomm/vurderinger-sist"));
}

describe("vurderinger.sh --nye-markøren", () => {
  it("flyttes bare av --nye uten filter", () => {
    expect(kjør(["--nye"])).toBe(true);
    expect(kjør([])).toBe(false);
    expect(kjør(["--nye", "--prefiks", "dag/04/"])).toBe(false);
  });
});
