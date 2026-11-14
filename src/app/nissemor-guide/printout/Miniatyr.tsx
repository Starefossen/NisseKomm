"use client";
/*
 * The one preview of a print: only the sheets as they print (`?bare=1`), every
 * side in a row, scaled so a whole A4 is `h` px high; the strip scrolls
 * sideways when it is wider than its place. A click opens it 1:1.
 */
import { useEffect, useRef, useState } from "react";
import { utskriftHref, utskriftTittel } from "./filer";

// A4 at 96 dpi and the gap between sheets (gap-6 in BARE).
const B = 794;
const H = 1123;
const GLIPE = 24;

export function UtskriftMiniatyr({
  navn,
  h = 226,
}: {
  navn: string;
  h?: number;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const ramme = useRef<HTMLIFrameElement>(null);
  const [info, setInfo] = useState({ sider: 1, papir: "" });
  const src = `${utskriftHref(navn)}?bare=1`;
  const tittel = utskriftTittel(navn);

  // Same origin, so the sheet count and paper line are read from the frame.
  // Polled for a few seconds after mount and after each load: the diploma
  // renders on the client, and a frame loaded before hydration fires no onLoad.
  const [lastet, setLastet] = useState(0);
  useEffect(() => {
    let igjen = 20;
    const t = setInterval(() => {
      const d = ramme.current?.contentDocument;
      const sider = d?.querySelectorAll("[data-ark]").length ?? 0;
      if (sider)
        setInfo({
          sider,
          papir: d!.querySelector("[data-papir]")?.textContent ?? "",
        });
      if (sider || --igjen <= 0) clearInterval(t);
    }, 300);
    return () => clearInterval(t);
  }, [lastet]);

  const k = h / H;
  const bredde = info.sider * B + (info.sider - 1) * GLIPE;
  return (
    <figure className="max-w-full min-w-0" data-testid="utskrift-miniatyr">
      <div className="max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => dlg.current?.showModal()}
          className="block overflow-hidden border border-(--neon-green) bg-white"
          style={{ width: Math.round(bredde * k), height: h }}
          title={`Vis ${tittel} i full størrelse`}
        >
          <iframe
            ref={ramme}
            src={src}
            title={tittel}
            loading="lazy"
            tabIndex={-1}
            onLoad={() => setLastet((n) => n + 1)}
            className="pointer-events-none origin-top-left border-0 max-w-none"
            style={{ width: bredde, height: H, transform: `scale(${k})` }}
          />
        </button>
      </div>
      {info.papir && (
        <figcaption className="text-xs opacity-70 mt-1">
          {info.papir}
        </figcaption>
      )}
      <dialog
        ref={dlg}
        className="m-auto w-[min(860px,96vw)] h-[92vh] p-0 bg-black border-2 border-(--gold) backdrop:bg-black/80"
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}
      >
        <div className="flex justify-between items-center p-2 text-(--gold)">
          <span>{tittel}</span>
          <button
            type="button"
            className="min-h-11 px-3 border border-(--gold)"
            onClick={() => dlg.current?.close()}
          >
            Lukk
          </button>
        </div>
        {/* 1:1, scrolls inside */}
        <iframe
          src={src}
          title={tittel}
          loading="lazy"
          className="w-full h-[calc(92vh-60px)] bg-white border-0"
        />
      </dialog>
    </figure>
  );
}
