import { describe, expect, it, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { PasswordPrompt, joinCode, splitCode } from "./PasswordPrompt";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  act(() => createRoot(host).render(<PasswordPrompt onSuccess={() => {}} />));
  return [1, 2, 3].map(
    (n) =>
      host.querySelector(
        `input[aria-label="Ord ${n} av 3"]`,
      ) as HTMLInputElement,
  );
}

// React tracks the value itself; go through the native setter so onChange fires
function type(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("splitCode / joinCode", () => {
  it("splits pasted codes with spaces or hyphens", () => {
    expect(splitCode("snø lykt rein")).toEqual(["snø", "lykt", "rein"]);
    expect(splitCode("  snø--lykt   rein")).toEqual(["snø", "lykt", "rein"]);
    expect(splitCode("snø-")).toEqual(["snø", ""]);
  });

  it("joins words the way auth.ts normalizes them", () => {
    expect(joinCode(["Snø", " lykt", "REIN "])).toBe("Snø lykt REIN");
  });
});

describe("PasswordPrompt", () => {
  it("fills all three fields from a paste in field 2 and sends the joined code", () => {
    const fetchMock = jest.fn(() => new Promise(() => {}));
    global.fetch = fetchMock as unknown as typeof fetch;
    const f = mount();
    expect(document.activeElement).toBe(f[0]);
    type(f[1], "snø-lykt  rein");
    expect(f.map((i) => i.value)).toEqual(["snø", "lykt", "rein"]);
    act(() => {
      f[0].form!.requestSubmit();
    });
    const init = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(JSON.parse(init.body as string)).toEqual({ code: "snø lykt rein" });
  });

  it("moves on with a space and back with Backspace", () => {
    const f = mount();
    type(f[0], "snø ");
    expect(document.activeElement).toBe(f[1]);
    act(() => {
      f[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(f[0]);
  });
});
