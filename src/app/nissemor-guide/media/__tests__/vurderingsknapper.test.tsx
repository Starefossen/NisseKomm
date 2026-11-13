import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Vurderingsknapper } from "../kort";
import { vurderTast } from "../../vurdering";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let boks: HTMLDivElement;
let root: Root;
const onSave = jest.fn<(v: string | null, note?: string) => Promise<void>>();
const flush = () => act(async () => {});

beforeEach(() => {
  onSave.mockReset();
  onSave.mockResolvedValue(undefined);
  boks = document.createElement("div");
  boks.id = "vurdering-gaatekart";
  document.body.appendChild(boks);
  root = createRoot(boks);
  act(() => root.render(<Vurderingsknapper onSave={onSave} />));
});
afterEach(() => {
  act(() => root.unmount());
  boks.remove();
});

const felt = () => boks.querySelector("input")!;
const skriv = (tekst: string) =>
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(felt(), tekst);
    felt().dispatchEvent(new Event("input", { bubbles: true }));
  });
const enter = () =>
  act(() => {
    felt().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });

describe("Vurderingsknapper", () => {
  it("lag på nytt uten notat lagres ikke: feltet får fokus og en melding", () => {
    act(() => vurderTast("l", "dag/04/gaatekart"));
    expect(document.activeElement).toBe(felt());
    enter();
    expect(onSave).not.toHaveBeenCalled();
    expect(boks.textContent).toContain("Skriv hva som må endres");
    skriv("for mørk");
    enter();
    expect(onSave).toHaveBeenCalledWith("lag_paa_nytt", "for mørk");
  });

  it("knappen lag på nytt krever notat, og lagrer notatet med valget", () => {
    const knapp = boks.querySelector<HTMLButtonElement>(
      '[data-verdikt="lag_paa_nytt"]',
    )!;
    act(() => knapp.click());
    expect(onSave).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(felt());
    skriv("lyd hakker");
    act(() => knapp.click());
    expect(onSave).toHaveBeenCalledWith("lag_paa_nytt", "lyd hakker");
  });

  it("O gir OK og G godkjent, med notatet i feltet", async () => {
    skriv("litt lang");
    act(() => vurderTast("o", "dag/04/gaatekart"));
    expect(onSave).toHaveBeenLastCalledWith("ok", "litt lang");
    await flush();
    act(() => vurderTast("g", "dag/04/gaatekart"));
    expect(onSave).toHaveBeenLastCalledWith("godkjent", "litt lang");
    expect(vurderTast("x", "dag/04/gaatekart")).toBe(false);
  });

  it("viser Lagrer…, valget med en gang og så ✓ Lagret", async () => {
    let ferdig!: () => void;
    onSave.mockReturnValue(new Promise<void>((r) => (ferdig = r)));
    const knapp = boks.querySelector<HTMLButtonElement>(
      '[data-verdikt="godkjent"]',
    )!;
    const før = knapp.className;
    act(() => knapp.click());
    expect(boks.querySelector("[aria-live]")!.textContent).toBe("Lagrer…");
    expect(knapp.className).not.toBe(før);
    await act(async () => ferdig());
    expect(boks.querySelector("[aria-live]")!.textContent).toBe("✓ Lagret");
  });

  it("feil: rød grunn som blir stående, og valget går tilbake", async () => {
    onSave.mockRejectedValue(new Error("du er logget ut"));
    const knapp = boks.querySelector<HTMLButtonElement>(
      '[data-verdikt="godkjent"]',
    )!;
    const før = knapp.className;
    act(() => knapp.click());
    await flush();
    expect(boks.querySelector("[aria-live]")!.textContent).toBe(
      "Ikke lagret: du er logget ut",
    );
    expect(knapp.className).toBe(før);
  });

  it("ett klikk på Lag på nytt med notat i feltet: én lagring med vurdering og notat", async () => {
    act(() => felt().focus());
    skriv("for mørk");
    const l = boks.querySelector<HTMLButtonElement>(
      '[data-verdikt="lag_paa_nytt"]',
    )!;
    act(() => l.focus()); // the blur a real click causes
    act(() => l.click());
    await flush();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("lag_paa_nytt", "for mørk");
    expect(l.disabled).toBe(false);
  });

  it("ett klikk på G med notat i feltet, ingen «Lagre notat»-knapp", async () => {
    act(() => felt().focus());
    skriv("fin");
    const g = boks.querySelector<HTMLButtonElement>(
      '[data-verdikt="godkjent"]',
    )!;
    act(() => g.focus());
    act(() => g.click());
    await flush();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("godkjent", "fin");
    expect(boks.textContent).not.toContain("Lagre notat");
  });
});

describe("Trenger mer (?)", () => {
  it("? åpner menyen; et valg lagrer hva og notat, uten å røre vurderingen", async () => {
    const onTrenger = jest.fn<(h: string | null, n: string) => Promise<void>>();
    onTrenger.mockResolvedValue(undefined);
    act(() =>
      root.render(
        <Vurderingsknapper
          onSave={onSave}
          onTrenger={onTrenger}
          vurdering={{ vurdering: "ok" }}
        />,
      ),
    );
    act(() => vurderTast("?", "dag/04/gaatekart"));
    const notat = boks.querySelector<HTMLInputElement>(
      '[aria-label="Notat til agenten"]',
    )!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(notat, "hvor står den?");
      notat.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() =>
      boks
        .querySelector<HTMLButtonElement>('[data-trenger-hva="skisse"]')!
        .click(),
    );
    await flush();
    expect(onTrenger).toHaveBeenCalledWith("skisse", "hvor står den?");
    expect(onSave).not.toHaveBeenCalled();
  });
});
