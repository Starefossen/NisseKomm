"use client";
/*
 * The one preview of a print: only the white sheets as they print (`?bare=1`),
 * every side shown whole, at most `kol` beside each other, each `h` px high
 * and smaller when the place is narrower. A click opens it 1:1.
 */
import { useEffect, useRef, useState } from "react";
import { utskriftHref, utskriftTittel } from "./filer";

// A4 at 96 dpi and the gap between sheets (Bare in Utskrift.tsx).
const B = 794;
const H = 1123;
const GLIPE = 24;

export function UtskriftMiniatyr({
  navn,
  h = 226,
  kol = 2,
}: {
  navn: string;
  h?: number;
  kol?: number;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const figur = useRef<HTMLElement>(null);
  const ramme = useRef<HTMLIFrameElement>(null);
  const [info, setInfo] = useState({ sider: 1, papir: "" });
  const [plass, setPlass] = useState(0);
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

  useEffect(() => {
    const o = new ResizeObserver(([e]) => setPlass(e.contentRect.width));
    o.observe(figur.current!);
    return () => o.disconnect();
  }, []);

  // The frame is exactly `iRad` sheets wide, so the page wraps the rest itself.
  const iRad = Math.min(kol, info.sider);
  const rader = Math.ceil(info.sider / iRad);
  const b = iRad * B + (iRad - 1) * GLIPE;
  const hoyde = rader * H + (rader - 1) * GLIPE;
  const k = Math.min(h / H, plass ? plass / b : 1);
  return (
    <figure ref={figur} className="w-full" data-testid="utskrift-miniatyr">
      <button
        type="button"
        onClick={() => dlg.current?.showModal()}
        className="block overflow-hidden"
        style={{ width: Math.floor(b * k), height: Math.floor(hoyde * k) }}
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
          style={{ width: b, height: hoyde, transform: `scale(${k})` }}
        />
      </button>
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
          className="w-full h-[calc(92vh-60px)] border-0"
        />
      </dialog>
    </figure>
  );
}
