/** @jest-environment node */
import { it } from "@jest/globals";
import { execFileSync } from "node:child_process";

it("tall.py: one log and one verdict file give known numbers", () => {
  execFileSync("python3", ["assets/bin/tall.py", "--selvtest"]);
});
