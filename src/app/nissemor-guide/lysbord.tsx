"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as PEvent,
  type ReactEventHandler,
} from "react";
import { createPortal } from "react-dom";
import { vurderTast } from "./vurdering";

/**
 * The guide's one image inspector. Every image is a <LysbordBilde>; click or F
 * opens it full screen. Zoom (Z, wheel, pinch) Tilpass · 1:1 · 2× · 4×, drag to
 * pan, Shift or LUPE for a 3× magnifier, V swaps old/new at the same zoom/pan,
 * ←/→ walk the images with the same `gruppe` in DOM order, Esc closes. With
 * `vurderId`, G/O/? reach that element's Vurder box (and L closes and focuses
 * its note), so the one-click rules stay in the box.
 */

type Bilde = { src: string; alt: string; gammel?: string; vurderId?: string };

export const pikselkunst = (src: string, bredde?: number) =>
  /spill\/piksel|\/ikon\/|ikon-/.test(src) || (!!bredde && bredde <= 256);

const NIVÅER = [1, 2, 4];

const lesBilde = (el: HTMLElement): Bilde => ({
  src: el.getAttribute("src")!,
  alt: el.dataset.lysbordAlt ?? "",
  gammel: el.dataset.lysbordGammel || undefined,
  vurderId: el.dataset.lysbordVurder || undefined,
});

function gruppe(el: HTMLElement): HTMLElement[] {
  const g = el.dataset.lysbord!;
  return [...document.querySelectorAll<HTMLElement>("[data-lysbord]")].filter(
    (x) => x.dataset.lysbord === g,
  );
}

const iFelt = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable);

export function LysbordBilde({
  src,
  alt,
  className,
  gruppe: g = "side",
  gammel,
  vurderId,
  klikk = true,
  loading,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  gruppe?: string;
  /** An older version: V swaps to it in the lightbox. */
  gammel?: string;
  vurderId?: string;
  /** False where a click means something else (the grid selects); F still opens. */
  klikk?: boolean;
  loading?: "lazy";
  onError?: ReactEventHandler<HTMLImageElement>;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [åpen, setÅpen] = useState<{ liste: Bilde[]; i: number } | null>(null);

  const åpne = useCallback((el: HTMLElement) => {
    const liste = gruppe(el);
    setÅpen({ liste: liste.map(lesBilde), i: Math.max(0, liste.indexOf(el)) });
  }, []);

  // F: only the page's first lightbox image listens, and opens the focused or hovered one.
  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      if (
        ev.key.toLowerCase() !== "f" ||
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        iFelt(ev.target) ||
        document.querySelector("[data-lysbord-apen]") ||
        document.querySelector("[data-lysbord]") !== ref.current
      )
        return;
      const fokus = document.activeElement;
      const mål =
        fokus?.querySelector<HTMLElement>("[data-lysbord]") ??
        (fokus instanceof HTMLElement && fokus.dataset.lysbord
          ? fokus
          : null) ??
        [...document.querySelectorAll<HTMLElement>("[data-lysbord]:hover")].at(
          -1,
        ) ??
        ref.current;
      if (!mål) return;
      ev.preventDefault();
      åpne(mål);
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, [åpne]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR, not in the build */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={loading}
        onError={onError}
        data-lysbord={g}
        data-lysbord-alt={alt}
        data-lysbord-gammel={gammel ?? ""}
        data-lysbord-vurder={vurderId ?? ""}
        onClick={klikk ? (ev) => åpne(ev.currentTarget) : undefined}
        className={`${className ?? ""} ${klikk ? "cursor-zoom-in" : ""} ${pikselkunst(src) ? "[image-rendering:pixelated]" : ""}`}
      />
      {åpen &&
        createPortal(
          <Lysbord
            liste={åpen.liste}
            start={åpen.i}
            lukk={() => setÅpen(null)}
          />,
          document.body,
        )}
    </>
  );
}

export function Lysbord({
  liste,
  start,
  lukk,
}: {
  liste: Bilde[];
  start: number;
  lukk: () => void;
}) {
  const [i, setI] = useState(start);
  const [visGammel, setVisGammel] = useState(false);
  // null = Tilpass; otherwise image px per natural px.
  const [skala, setSkala] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [flate, setFlate] = useState({ w: 1, h: 1 });
  const [lupe, setLupe] = useState(false);
  const [shift, setShift] = useState(false);
  const [mus, setMus] = useState<{ x: number; y: number } | null>(null);
  const [melding, setMelding] = useState("");
  const flateRef = useRef<HTMLDivElement>(null);
  const pekere = useRef(new Map<number, { x: number; y: number }>());
  const dra = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const klyp = useRef<{ d: number; s: number } | null>(null);

  const b = liste[i];
  const src = visGammel && b.gammel ? b.gammel : b.src;
  const tilpass =
    nat.w && nat.h ? Math.min(flate.w / nat.w, flate.h / nat.h, 1) : 1;
  const s = skala ?? tilpass;
  const piksel = pikselkunst(src, nat.w);

  useEffect(() => {
    const el = flateRef.current;
    if (!el) return;
    const mål = () => setFlate({ w: el.clientWidth, h: el.clientHeight });
    mål();
    const ro = new ResizeObserver(mål);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gå = useCallback(
    (d: number) => {
      if (liste.length < 2) return;
      setI((x) => (x + d + liste.length) % liste.length);
      setSkala(null);
      setPan({ x: 0, y: 0 });
      setVisGammel(false);
    },
    [liste.length],
  );

  const nesteNivå = useCallback(() => {
    // Tilpass → 1:1 → 2× → 4× → Tilpass
    const neste = NIVÅER.find((n) => n > s + 0.01);
    setSkala(skala === null ? 1 : (neste ?? null));
    if (!neste) setPan({ x: 0, y: 0 });
  }, [s, skala]);

  const vurder = useCallback(
    (tast: string) => {
      if (!b.vurderId) return false;
      if (tast === "l") {
        lukk();
        return vurderTast("l", b.vurderId);
      }
      if (!vurderTast(tast, b.vurderId)) return false;
      const boks = document.querySelector(
        `#vurdering-${CSS.escape(b.vurderId.split("/").at(-1)!)}`,
      );
      setMelding(
        tast === "g" ? "Godkjent…" : tast === "o" ? "OK…" : "Trenger mer…",
      );
      // Mirror the box's own «Lagrer…/✓ Lagret/Ikke lagret» line.
      let n = 0;
      const t = setInterval(() => {
        const tekst = boks
          ?.querySelector<HTMLElement>("[data-lagring]")
          ?.textContent?.trim();
        if (tekst) setMelding(tekst);
        if (++n > 12) clearInterval(t);
      }, 200);
      return true;
    },
    [b.vurderId, lukk],
  );

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      if (ev.key === "Shift") setShift(true);
      if (ev.metaKey || ev.ctrlKey || ev.altKey || iFelt(ev.target)) return;
      const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      let tatt = true;
      if (k === "Escape") lukk();
      else if (k === "ArrowRight") gå(1);
      else if (k === "ArrowLeft") gå(-1);
      else if (k === "z") nesteNivå();
      else if (k === "v" && b.gammel) setVisGammel((v) => !v);
      else if (k === "f") lukk();
      else if (["g", "o", "l", "?"].includes(k)) tatt = vurder(k);
      else tatt = false;
      if (tatt) {
        ev.preventDefault();
        // The page's own G/O/N/P handlers must not fire under the lightbox.
        ev.stopImmediatePropagation();
      }
    };
    const opp = (ev: KeyboardEvent) => ev.key === "Shift" && setShift(false);
    window.addEventListener("keydown", ned, true);
    window.addEventListener("keyup", opp);
    return () => {
      window.removeEventListener("keydown", ned, true);
      window.removeEventListener("keyup", opp);
    };
  }, [lukk, gå, nesteNivå, vurder, b.gammel]);

  // Zoom around a point (screen coords relative to the centre of the stage).
  const zoomTil = (ny: number, cx = 0, cy = 0) => {
    const z = Math.min(8, Math.max(tilpass, ny));
    const f = z / s;
    setPan((p) => ({ x: cx - (cx - p.x) * f, y: cy - (cy - p.y) * f }));
    setSkala(z <= tilpass + 0.001 ? null : z);
    if (z <= tilpass + 0.001) setPan({ x: 0, y: 0 });
  };
  const sentrum = (x: number, y: number) => {
    const r = flateRef.current!.getBoundingClientRect();
    return { cx: x - r.left - r.width / 2, cy: y - r.top - r.height / 2 };
  };

  const ned = (ev: PEvent) => {
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    pekere.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pekere.current.size === 2) {
      const [a, c] = [...pekere.current.values()];
      klyp.current = { d: Math.hypot(a.x - c.x, a.y - c.y), s };
      dra.current = null;
    } else dra.current = { x: ev.clientX, y: ev.clientY, px: pan.x, py: pan.y };
  };
  const flytt = (ev: PEvent) => {
    const rr = ev.currentTarget.getBoundingClientRect();
    setMus({ x: ev.clientX - rr.left, y: ev.clientY - rr.top });
    if (!pekere.current.has(ev.pointerId)) return;
    pekere.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (klyp.current && pekere.current.size === 2) {
      const [a, c] = [...pekere.current.values()];
      const { cx, cy } = sentrum((a.x + c.x) / 2, (a.y + c.y) / 2);
      zoomTil(
        (klyp.current.s * Math.hypot(a.x - c.x, a.y - c.y)) / klyp.current.d,
        cx,
        cy,
      );
    } else if (dra.current && skala !== null)
      setPan({
        x: dra.current.px + ev.clientX - dra.current.x,
        y: dra.current.py + ev.clientY - dra.current.y,
      });
  };
  const slipp = (ev: PEvent) => {
    const d = dra.current;
    pekere.current.delete(ev.pointerId);
    if (pekere.current.size < 2) klyp.current = null;
    dra.current = null;
    // Swipe at Tilpass walks the group.
    if (d && skala === null && ev.pointerType !== "mouse") {
      const dx = ev.clientX - d.x;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(ev.clientY - d.y))
        gå(dx < 0 ? 1 : -1);
    }
  };

  const visLupe = (lupe || shift) && mus && nat.w;
  const bw = nat.w * s;
  const bh = nat.h * s;
  // Magnifier: the point under the pointer in natural px, shown at 3× of the screen size.
  const lupeData = visLupe
    ? {
        ix: (mus.x - flate.w / 2 - pan.x + bw / 2) / s,
        iy: (mus.y - flate.h / 2 - pan.y + bh / 2) / s,
        z: s * 3,
      }
    : null;
  const knapp = "min-h-11 min-w-11 px-2 border-2 border-(--neon-green)";
  const nivåNavn = (n: number | null) =>
    n === null ? "Tilpass" : n === 1 ? "1:1" : `${n}×`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={b.alt || src}
      data-lysbord-apen
      data-testid="lysbord"
      data-skala={s.toFixed(3)}
      data-pan={`${pan.x},${pan.y}`}
      data-vis={visGammel ? "gammel" : "ny"}
      className="fixed inset-0 z-[1000] flex flex-col bg-black text-(--neon-green)"
    >
      <div className="flex flex-wrap items-center gap-2 p-2 text-base">
        {[null, ...NIVÅER].map((n) => (
          <button
            key={String(n)}
            type="button"
            aria-pressed={skala === n}
            onClick={() => {
              setSkala(n);
              setPan({ x: 0, y: 0 });
            }}
            className={`${knapp} ${skala === n ? "bg-(--neon-green) text-black" : "bg-black"}`}
          >
            {nivåNavn(n)}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={lupe}
          onClick={() => setLupe(!lupe)}
          className={`${knapp} ${lupe ? "bg-(--neon-green) text-black" : "bg-black"}`}
        >
          LUPE
        </button>
        {b.gammel && (
          <button
            type="button"
            onClick={() => setVisGammel(!visGammel)}
            className={knapp}
          >
            V {visGammel ? "Gammel" : "Ny"}
          </button>
        )}
        {liste.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => gå(-1)}
              className={knapp}
              aria-label="Forrige"
            >
              ←
            </button>
            <span>
              {i + 1}/{liste.length}
            </span>
            <button
              type="button"
              onClick={() => gå(1)}
              className={knapp}
              aria-label="Neste"
            >
              →
            </button>
          </>
        )}
        <span className="text-sm break-all flex-1 min-w-0">{src}</span>
        <span
          aria-live="polite"
          className="text-(--gold)"
          data-testid="lysbord-melding"
        >
          {melding}
        </span>
        <button type="button" onClick={lukk} className={knapp} autoFocus>
          Lukk
        </button>
      </div>
      <div
        ref={flateRef}
        onPointerDown={ned}
        onPointerMove={flytt}
        onPointerUp={slipp}
        onPointerCancel={slipp}
        onPointerLeave={() => setMus(null)}
        onWheel={(ev) => {
          const { cx, cy } = sentrum(ev.clientX, ev.clientY);
          zoomTil(s * Math.pow(1.0015, -ev.deltaY), cx, cy);
        }}
        className={`relative flex-1 overflow-hidden touch-none select-none ${skala !== null ? "cursor-grab" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR, not in the build */}
        <img
          src={src}
          alt={b.alt}
          draggable={false}
          onLoad={(e) =>
            setNat({
              w: e.currentTarget.naturalWidth,
              h: e.currentTarget.naturalHeight,
            })
          }
          style={{
            width: bw || undefined,
            height: bh || undefined,
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          }}
          className={`absolute max-w-none ${nat.w ? "" : "max-h-full"} ${piksel ? "[image-rendering:pixelated]" : ""}`}
        />
        {lupeData && mus && (
          <div
            aria-hidden
            data-testid="lupe"
            className="pointer-events-none absolute w-48 h-48 rounded-full border-2 border-(--gold)"
            style={{
              left: mus.x - 96,
              top: mus.y - 96,
              backgroundImage: `url("${src}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${nat.w * lupeData.z}px ${nat.h * lupeData.z}px`,
              backgroundPosition: `${96 - lupeData.ix * lupeData.z}px ${96 - lupeData.iy * lupeData.z}px`,
              imageRendering: piksel ? "pixelated" : undefined,
            }}
          />
        )}
      </div>
      <p className="p-2 text-sm text-(--neon-green)/80">
        Z zoom · hjul/klyp · dra panorerer · Shift lupe
        {b.gammel ? " · V gammel/ny" : ""}
        {liste.length > 1 ? " · ←/→ bla" : ""}
        {b.vurderId ? " · G/O/L/? vurder" : ""} · Esc lukker
      </p>
    </div>
  );
}
