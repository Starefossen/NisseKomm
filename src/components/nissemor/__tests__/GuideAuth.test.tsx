import { it, expect, jest } from "@jest/globals";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameEngine } from "@/lib/game-engine";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push() {} }) }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Like Brevfugler and the diploma: reads once on mount, no useSynk.
function Brev() {
  const [brev] = useState(() => GameEngine.getSantaLetters());
  return <p id="brev">{brev.length}</p>;
}

it("a restored guide session pulls the shared state before the page reads it", async () => {
  // After the mock: @jest/globals' jest.mock is not hoisted above imports.
  const { GuideAuth } = await import("../GuideAuth");
  const svar: Record<string, unknown> = {
    "/api/auth/verify": { role: "parent" },
    "/api/familie": { barn: [], hjem: "" },
    "/api/state": {
      "nissekomm-santa-letters": [{ day: 7, content: "Hei Julius" }],
    },
  };
  global.fetch = jest.fn(
    async (url: unknown) =>
      ({
        ok: true,
        status: 200,
        json: async () => svar[String(url)],
      }) as Response,
  ) as unknown as typeof fetch;
  const el = document.createElement("div");
  document.body.appendChild(el);
  await act(async () => {
    createRoot(el).render(
      <GuideAuth>
        <Brev />
      </GuideAuth>,
    );
  });
  await act(async () => {});
  expect(el.querySelector("#brev")?.textContent).toBe("1");
});
