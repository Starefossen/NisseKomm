/**
 * @jest-environment node
 */
import { expect, test } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The runtime image's TZ, run in a fresh Node like the container's.
const tz = /\bTZ=(\S+)/.exec(readFileSync("Dockerfile", "utf8"))?.[1];
const dagI = (iso: string) =>
  execFileSync(
    process.execPath,
    [
      "-e",
      `const d=new Date("${iso}");console.log(d.getMonth()+1+"-"+d.getDate())`,
    ],
    { env: { ...process.env, TZ: tz }, encoding: "utf8" },
  ).trim();

test("the container's day turns at midnight Oslo time", () => {
  expect(tz).toBe("Europe/Oslo");
  expect(dagI("2026-11-30T22:59:59Z")).toBe("11-30");
  expect(dagI("2026-11-30T23:00:00Z")).toBe("12-1");
  expect(dagI("2026-12-23T23:00:00Z")).toBe("12-24");
});
