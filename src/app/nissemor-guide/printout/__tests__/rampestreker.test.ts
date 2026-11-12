import { describe, it, expect } from "@jest/globals";
import { quests } from "@/lib/__tests__/synlig-tekst";
import { STREK_TITLER } from "../rampestreker/titler";

describe("rampestreker-ark", () => {
  it("har 24 titler uten kodeord", () => {
    expect(STREK_TITLER).toHaveLength(24);
    const lekk = STREK_TITLER.flatMap((t) =>
      quests
        .filter((q) => new RegExp(q.kode, "i").test(t))
        .map((q) => `${q.kode} i «${t}»`),
    );
    expect(lekk).toEqual([]);
  });
});
