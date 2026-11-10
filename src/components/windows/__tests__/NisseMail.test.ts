import { describe, it, expect } from "@jest/globals";
import { velgStartEpost } from "../NisseMail";
import type { Oppdrag } from "@/types/innhold";

const m = (dag: number, bonus = false) =>
  ({ dag, ...(bonus ? { bonusoppdrag: {} } : {}) }) as unknown as Oppdrag;
const missions = [m(1), m(2), m(3, true), m(4)];
const none = new Set<number>();

describe("NisseMail: e-posten som åpnes", () => {
  it("åpner dagen fra kalenderen", () => {
    expect(velgStartEpost(missions, 3, 2, none, none, none)?.day).toBe(2);
  });

  it("åpner aldri en framtidig dag fra kalenderen", () => {
    expect(velgStartEpost(missions, 2, 4, none, none, none)?.day).toBe(2);
  });

  it("åpner dagens e-post uten kalenderdag", () => {
    expect(velgStartEpost(missions, 3, null, none, none, none)?.day).toBe(3);
  });

  it("faller tilbake til første uleste, ikke en framtidig", () => {
    const sett = new Set([1]);
    const e = velgStartEpost(missions, 30, null, sett, none, none);
    expect(e?.day).toBe(2);
  });

  it("viser bonus-e-post når dagen er løst og alt annet er lest", () => {
    const lest = new Set([1, 2, 3, 4]);
    const e = velgStartEpost(missions, 30, null, lest, none, new Set([3]));
    expect(e).toMatchObject({ type: "side-quest", day: 3 });
  });

  it("ingen e-post før 1. desember", () => {
    expect(velgStartEpost(missions, 0, null, none, none, none)).toBeNull();
  });
});
