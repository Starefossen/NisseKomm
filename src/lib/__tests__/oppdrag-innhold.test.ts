import { test, expect } from "@jest/globals";
import { execFileSync } from "child_process";

// The manus is the source; the script must reproduce the committed JSON exactly.
test("oppdrag-innhold.py --check: src/data matches docs/manus", () => {
  expect(() =>
    execFileSync("python3", ["scripts/oppdrag-innhold.py", "--check"], {
      stdio: "pipe",
    }),
  ).not.toThrow();
}, 60000);
