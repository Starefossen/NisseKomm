import { describe, it, expect } from "@jest/globals";
import nextConfig from "../../../next.config";

describe("next.config headers", () => {
  it("allows camera for the symbol scanner on all pages", async () => {
    const rules = await nextConfig.headers!();
    const page = rules.find((r) => r.source === "/(.*)");
    expect(page?.headers).toContainEqual({
      key: "Permissions-Policy",
      value: "camera=(self)",
    });
  });
});
