import { describe, expect, it } from "@jest/globals";
import { besøk, tilbake } from "./historikk";

describe("P går tilbake til det som faktisk ble sett", () => {
  it("N, N, Shift+N, P, P gives the viewed items in reverse", () => {
    let s: string[] = [];
    for (const id of ["a", "b", "c", "x"]) s = besøk(s, id); // start, N, N, Shift+N
    let mål: string | undefined;
    [s, mål] = tilbake(s);
    expect(mål).toBe("c");
    s = besøk(s, mål!); // landing on c must not push it twice
    [s, mål] = tilbake(s);
    expect(mål).toBe("b");
    s = besøk(s, mål!);
    expect(s).toEqual(["a", "b"]);
  });
});
