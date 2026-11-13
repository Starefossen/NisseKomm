import { describe, expect, it } from "@jest/globals";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { endreLaerdom, lesLaerdom } from "../laerdom";

describe("laerdom", () => {
  it("adds, turns off and rejects; refuses an empty rule", async () => {
    const fil = path.join(
      await mkdtemp(path.join(tmpdir(), "laerdom-")),
      "l.json",
    );
    await endreLaerdom(
      {
        handling: "regel",
        type: "tv",
        regel: " unngå: zoom ",
        kilder: ["video/tv/a.mp4"],
      },
      fil,
    );
    await endreLaerdom({ handling: "av", indeks: 0 }, fil);
    await endreLaerdom({ handling: "avvis", kilder: ["x", "x"] }, fil);
    const d = await lesLaerdom(fil);
    expect(d.regler[0]).toMatchObject({
      type: "tv",
      regel: "unngå: zoom",
      aktiv: false,
    });
    expect(d.avvist).toEqual(["x"]);
    await expect(
      endreLaerdom(
        { handling: "regel", type: "tv", regel: " ", kilder: [] },
        fil,
      ),
    ).rejects.toThrow();
    await expect(
      endreLaerdom({ handling: "på", indeks: 5 }, fil),
    ).rejects.toThrow();
  });
});
