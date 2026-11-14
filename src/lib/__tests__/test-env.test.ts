/**
 * @jest-environment node
 */
import { describe, it, expect, afterEach } from "@jest/globals";
import { åpenTilDag } from "../kode";
import { getCurrentDate } from "../date-utils";

const env = process.env as Record<string, string | undefined>;
const før = { ...env };
afterEach(() => {
  for (const k of [
    "NODE_ENV",
    "NISSEKOMM_MODE",
    "NEXT_PUBLIC_TEST_MODE",
    "NEXT_PUBLIC_MOCK_DAY",
    "NEXT_PUBLIC_MOCK_MONTH",
  ])
    env[k] = før[k];
});

describe("TEST_MODE/MOCK_* som kjøretids-env på serveren", () => {
  it("public + production ignorerer dem (koder og dato)", () => {
    Object.assign(env, {
      NODE_ENV: "production",
      NISSEKOMM_MODE: "public",
      NEXT_PUBLIC_TEST_MODE: "true",
      NEXT_PUBLIC_MOCK_DAY: "24",
      NEXT_PUBLIC_MOCK_MONTH: "12",
    });
    const nå = new Date();
    expect(getCurrentDate().getDate()).toBe(nå.getDate());
    expect(åpenTilDag(0)).toBe(
      nå.getMonth() === 11 ? Math.min(24, nå.getDate()) : 0,
    );
  });

  it("lan-modus beholder dem", () => {
    Object.assign(env, {
      NODE_ENV: "production",
      NISSEKOMM_MODE: "lan",
      NEXT_PUBLIC_TEST_MODE: "true",
    });
    expect(åpenTilDag(0)).toBe(24);
  });
});
