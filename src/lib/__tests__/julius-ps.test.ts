import { describe, it, expect, beforeEach } from "@jest/globals";
import { GameEngine } from "../game-engine";
import { StorageManager } from "../storage";
import { getQuestByDay } from "../data-loader";

const q = (day: number) => getQuestByDay(day)!;

describe("GameEngine.getJuliusPs", () => {
  beforeEach(() => localStorage.clear());

  it("uses the bonus variant on day 11 once ANTENNE2026 is approved", () => {
    expect(GameEngine.getJuliusPs(11)).toBe(q(11).julius_ps);
    GameEngine.completeBonusOppdrag(11);
    expect(GameEngine.getJuliusPs(11)).toBe(q(11).julius_ps_bonus);
  });

  it("uses the lantern variant on days 16-19 once LYKT2026 is approved", () => {
    GameEngine.completeBonusOppdrag(16);
    for (const d of [16, 17, 18, 19]) {
      expect(GameEngine.getJuliusPs(d)).toBe(q(d).julius_ps_bonus);
    }
    expect(GameEngine.getJuliusPs(20)).not.toBe(q(20).julius_ps_bonus);
  });

  it("uses the 'krypto mangler' variant on day 20 until stjernetegn is solved", () => {
    StorageManager.addSolvedDecryption("frosne-koder");
    expect(GameEngine.getJuliusPs(20)).toBe(q(20).julius_ps_krypto_mangler);
    StorageManager.addSolvedDecryption("stjernetegn");
    expect(GameEngine.getJuliusPs(20)).toBe(q(20).julius_ps);
  });
});
