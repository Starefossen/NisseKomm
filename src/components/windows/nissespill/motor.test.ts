import { describe, it, expect } from "@jest/globals";
import type { EventyrSave } from "@/lib/storage";
import * as M from "./motor";

const save = (...flags: string[]): EventyrSave => ({
  kapittel: 9,
  sceneId: "a",
  inventory: [],
  flags,
  hints: {},
});

describe("motor: vilkår", () => {
  const v: M.Vilkaar = {
    alle: [
      { hvis: "lampe" },
      { en_av: [{ hvis: "nokkel" }, { hvis: "kode" }] },
    ],
    uten: "ferdig",
  };
  it("alle og en_av kan nøstes, hvis/uten virker som før", () => {
    expect(M.ok(v, save("lampe"))).toBe(false);
    expect(M.ok(v, save("lampe", "kode"))).toBe(true);
    expect(M.ok(v, save("lampe", "nokkel", "ferdig"))).toBe(false);
    expect(M.ok({ hvis: "a" }, save("a"))).toBe(true);
    expect(M.ok({ en_av: [] }, save())).toBe(false);
  });
});
