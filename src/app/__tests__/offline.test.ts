/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("public/nissemor-guide/offline.html", () => {
  it("has no inline script or handler (the nonce CSP in proxy.ts blocks them)", () => {
    const html = readFileSync(
      join(process.cwd(), "public/nissemor-guide/offline.html"),
      "utf8",
    ).replace(/<!--[\s\S]*?-->/g, "");
    expect(html).not.toMatch(/<script|\son\w+\s*=|javascript:/i);
    expect(html).toMatch(/<a href="">/);
  });
});
