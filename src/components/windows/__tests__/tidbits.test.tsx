import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { KodeTerminal } from "../KodeTerminal";
import { NisseNetUtforsker } from "../NisseNetUtforsker";
import { IdlePeek } from "@/components/ui/IdlePeek";
import { GameEngine } from "@/lib/game-engine";
import { StorageManager } from "@/lib/storage";
import { setTimeOverride } from "@/lib/date-utils";
import { IDLE_MS, TIDBITS } from "@/lib/tidbits";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mount(node: React.ReactNode) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  act(() => createRoot(el).render(node));
  return el;
}

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

async function submit(el: HTMLElement) {
  await act(async () => {
    el.querySelector("form")!.requestSubmit();
    await jest.advanceTimersByTimeAsync(1600);
  });
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  jest.useFakeTimers();
  setTimeOverride({ day: 24, month: 12, hour: 12, minute: 0 });
});
afterEach(() => {
  setTimeOverride(null);
  jest.useRealTimers();
});

describe("KodeTerminal tidbits", () => {
  const terminal = () =>
    mount(<KodeTerminal onClose={() => {}} currentDay={1} />);

  it("a secret word replies and is not a failed attempt", async () => {
    const el = terminal();
    const h = TIDBITS.terminal.hemmeligeOrd[0];
    type(el.querySelector("input")!, h.ord[0].toLowerCase());
    await submit(el);
    expect(el.textContent).toContain(h.tekst);
    expect(el.textContent).not.toContain("FEIL KODE");
    expect(GameEngine.getFailedAttempts(1)).toBe(0);
  });

  it("a wrong code still counts and gets a joke line", async () => {
    const el = terminal();
    type(el.querySelector("input")!, "TULLEKODE");
    await submit(el);
    expect(GameEngine.getFailedAttempts(1)).toBe(1);
    expect(el.textContent).toContain(TIDBITS.terminal.feilKode[0].tekst);
  });
});

describe("NisseNet password file", () => {
  it("hides the text until the password is right", async () => {
    const file = TIDBITS.nissenet.filer.find((f) => f.passord)!;
    const el = mount(
      <NisseNetUtforsker
        files={[]}
        missions={[]}
        currentDay={24}
        onClose={() => {}}
      />,
    );
    const btn = [...el.querySelectorAll("button")].find(
      (b) => b.textContent === file.navn,
    )!;
    act(() => btn.click());
    expect(el.textContent).not.toContain(file.tekst);

    type(el.querySelector("input")!, "feil");
    await submit(el);
    expect(el.textContent).not.toContain(file.tekst);
    expect(el.textContent).toContain(TIDBITS.nissenet.feilPassord[0].tekst);

    type(el.querySelector("input")!, file.passord!.toUpperCase());
    await submit(el);
    expect(el.textContent).toContain(file.tekst);
  });
});

describe("IdlePeek", () => {
  it("peeks after the idle time, then not again within the hour", () => {
    const el = mount(<IdlePeek />);
    act(() => {
      jest.advanceTimersByTime(IDLE_MS);
    });
    expect(
      TIDBITS.idle.linjer.some((l) => el.textContent!.includes(l.tekst)),
    ).toBe(true);
    expect(StorageManager.getIdlePeek()).not.toBeNull();

    act(() => {
      window.dispatchEvent(new Event("keydown"));
    });
    expect(el.textContent).toBe("");
    act(() => {
      jest.advanceTimersByTime(IDLE_MS);
    });
    expect(el.textContent).toBe("");
  });
});
