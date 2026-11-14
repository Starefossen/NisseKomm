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

  it("the browser's back is a step back too: P then goes further back, not forward again", () => {
    let s = ["a", "b", "c"];
    s = besøk(s, "b", true); // browser back from c
    expect(s).toEqual(["a", "b"]);
    expect(tilbake(s)[1]).toBe("a");
    // Browser forward (or back to something else) is an ordinary visit.
    expect(besøk(["a", "b"], "c", true)).toEqual(["a", "b", "c"]);
    // A link to the item before is a visit, not a step back.
    expect(besøk(["a", "b"], "a")).toEqual(["a", "b", "a"]);
  });

  it("a verdict never touches the stack: G on b, N to c, P is b although b left the queue", () => {
    let s: string[] = [];
    for (const id of ["a", "b", "c"]) s = besøk(s, id);
    expect(tilbake(s)[1]).toBe("b");
  });
});
