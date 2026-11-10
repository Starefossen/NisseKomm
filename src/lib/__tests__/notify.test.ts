import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { CHANNELS, notify, type Notification } from "../notify";
import { eventsForWrite, frostOnEvent } from "../notify/events";
import { getAllOppdrag } from "../oppdrag";

const n: Notification = {
  event: "day_solved",
  day: 3,
  title: "t",
  body: "b",
  audience: "parents",
};

describe("notify", () => {
  const orig = { ...CHANNELS };
  afterEach(() => {
    Object.assign(CHANNELS, orig);
    delete process.env.NOTIFY_CHANNELS;
  });

  it("is a no-op with no channels", async () => {
    const log = jest.fn<(x: Notification) => void>();
    CHANNELS.log = log;
    await notify(n);
    expect(log).not.toHaveBeenCalled();
  });

  it("fans out to enabled channels and isolates a failing one", async () => {
    const log = jest.fn<(x: Notification) => void>();
    const varden = jest.fn<(x: Notification) => void>();
    CHANNELS.log = log;
    CHANNELS.varden = varden;
    CHANNELS.email = () => {
      throw new Error("nede");
    };
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.NOTIFY_CHANNELS = "email, log,varden,ukjent";
    await expect(notify(n)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(n);
    expect(varden).toHaveBeenCalledWith(n);
  });
});

describe("eventsForWrite", () => {
  const kode = (dag: number) => ({
    kode: getAllOppdrag().find((o) => o.dag === dag)!.kode,
    dato: "2026-12-01",
  });

  it("emits day_solved and milestone for a new solve", () => {
    const ev = eventsForWrite("nissekomm-codes", [kode(6)], [kode(6), kode(7)]);
    expect(ev.map((e) => e.event)).toEqual(["day_solved", "milestone"]);
    expect(ev[0].day).toBe(7);
  });

  it("emits frost_off on day 10 and season_complete on day 24", () => {
    expect(
      eventsForWrite("nissekomm-codes", [], [kode(10)]).map((e) => e.event),
    ).toContain("frost_off");
    expect(
      eventsForWrite("nissekomm-codes", [], [kode(24)]).map((e) => e.event),
    ).toEqual(["day_solved", "milestone", "season_complete"]);
  });

  it("emits nothing for a resubmitted day", () => {
    expect(eventsForWrite("nissekomm-codes", [kode(5)], [kode(5)])).toEqual([]);
  });

  it("emits bonus_approved for a newly approved bonus", () => {
    const ev = eventsForWrite(
      "nissekomm-bonusoppdrag-completed",
      [11],
      [11, 16],
    );
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ event: "bonus_approved", day: 16 });
  });

  it("frost_on only on an unsolved frost day before 20", () => {
    expect(frostOnEvent({}, 10, 12, 9)?.event).toBe("frost_on");
    expect(frostOnEvent({}, 10, 12, 21)).toBeNull();
    expect(frostOnEvent({}, 9, 12, 9)).toBeNull();
    expect(
      frostOnEvent({ "nissekomm-codes": [kode(21)] }, 21, 12, 9),
    ).toBeNull();
  });
});
