/** @jest-environment node */
import { describe, it, expect, afterEach } from "@jest/globals";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const req = (url: string, headers: Record<string, string>) =>
  proxy(new NextRequest(url, { headers }));

describe("www redirect", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY;
  });

  it("301s www to the apex, keeping path and query", () => {
    for (const host of ["www.nissekomm.no", "WWW.NisseKomm.no:443"]) {
      const r = req("http://x/dag/3?a=b&c=d", { host });
      expect(r.status).toBe(301);
      expect(r.headers.get("location")).toBe(
        "https://nissekomm.no/dag/3?a=b&c=d",
      );
    }
  });

  it("leaves other hosts alone", () => {
    for (const host of ["nissekomm.no", "localhost:3000", "nissekomm.lan"]) {
      expect(req("http://x/", { host }).status).toBe(200);
    }
  });

  it("never redirects off the fixed origin", () => {
    const r = req("http://x//evil.com/%2F..", { host: "www.nissekomm.no" });
    expect(new URL(r.headers.get("location")!).origin).toBe(
      "https://nissekomm.no",
    );
  });

  it("honours X-Forwarded-Host only with TRUST_PROXY=1", () => {
    const h = { host: "internal", "x-forwarded-host": "www.nissekomm.no" };
    expect(req("http://x/", h).status).toBe(200);
    process.env.TRUST_PROXY = "1";
    expect(req("http://x/", h).status).toBe(301);
  });
});
