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
const onSave = jest.fn();

beforeEach(() => {
  onSave.mockReset();
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

  it("O gir OK og G godkjent, med notatet i feltet", () => {
    skriv("litt lang");
    act(() => vurderTast("o", "dag/04/gaatekart"));
    expect(onSave).toHaveBeenLastCalledWith("ok", "litt lang");
    act(() => vurderTast("g", "dag/04/gaatekart"));
    expect(onSave).toHaveBeenLastCalledWith("godkjent", "litt lang");
    expect(vurderTast("x", "dag/04/gaatekart")).toBe(false);
  });
});
