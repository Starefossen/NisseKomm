/** @jest-environment node */
import { execFileSync } from "child_process";
import path from "path";
import { expect, it } from "@jest/globals";

// Guards against Tailwind's source scan silently dropping classes (md:flex-row
// went missing in the guide). Runs in plain node: @tailwindcss/node is ESM-only for jest.
it("globals.css generates classes used in the guide", () => {
  const from = path.join(__dirname, "../globals.css");
  const script = `
    const fs = require("fs"), postcss = require("postcss"), tw = require("@tailwindcss/postcss");
    postcss([tw()]).process(fs.readFileSync(process.argv[1], "utf8"), { from: process.argv[1] })
      .then((r) => process.stdout.write(r.css));`;
  const css = execFileSync("node", ["-e", script, from], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  for (const c of ["md\\:float-right", "md\\:w-60", "md\\:grid-cols-2"]) {
    expect(css).toContain(`.${c} {`);
  }
}, 60000);
