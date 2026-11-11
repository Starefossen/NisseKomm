"use client";

import { useRef, useState } from "react";
import type { Rect, Scene } from "./motor";

/**
 * Dev-only («Vis soner»): every hotspot of the scene (hidden ones too) and the
 * feather, outlined with their id. Drag to move, drag the corner to resize,
 * then copy the rects as JSON and paste them into kapittel*.ts.
 */
export function SoneEditor({ scene }: { scene: Scene }) {
  const [soner, setSoner] = useState<Record<string, Rect>>(() => {
    const s: Record<string, Rect> = {};
    for (const h of scene.hotspots) s[h.id] ??= h.rect;
    if (scene.fjaer) s.fjaer = scene.fjaer;
    return s;
  });
  const [kopiert, setKopiert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const dra =
    (id: string, modus: "flytt" | "skaler") => (e: React.PointerEvent) => {
      e.stopPropagation();
      const box = ref.current!.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY, r: soner[id] };
      const r1 = (n: number) => Math.round(n * 2) / 2;
      const flytt = (m: PointerEvent) => {
        const dx = ((m.clientX - start.x) / box.width) * 100;
        const dy = ((m.clientY - start.y) / box.height) * 100;
        const r = start.r;
        setSoner((s) => ({
          ...s,
          [id]:
            modus === "flytt"
              ? { ...r, x: r1(r.x + dx), y: r1(r.y + dy) }
              : {
                  ...r,
                  w: r1(Math.max(1, r.w + dx)),
                  h: r1(Math.max(1, r.h + dy)),
                },
        }));
      };
      const slipp = () => {
        window.removeEventListener("pointermove", flytt);
        window.removeEventListener("pointerup", slipp);
      };
      window.addEventListener("pointermove", flytt);
      window.addEventListener("pointerup", slipp);
    };

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-10"
      style={{ touchAction: "none" }}
    >
      {Object.entries(soner).map(([id, r]) => (
        <div
          key={id}
          data-sone={id}
          onPointerDown={dra(id, "flytt")}
          className={`absolute border-2 cursor-move ${id === "fjaer" ? "border-(--cold-blue)" : "border-(--gold)"} bg-black/20`}
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.w}%`,
            height: `${r.h}%`,
          }}
        >
          <span className="absolute left-0 top-0 px-1 bg-black/80 text-sm text-(--gold) whitespace-nowrap pointer-events-none">
            {id}
          </span>
          <span
            onPointerDown={dra(id, "skaler")}
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-(--gold) cursor-nwse-resize"
          />
        </div>
      ))}
      <button
        type="button"
        className="absolute top-2 right-2 min-h-11 px-3 bg-black/80 border border-(--gold) text-(--gold)"
        onClick={() => {
          navigator.clipboard?.writeText(JSON.stringify(soner, null, 1));
          setKopiert(true);
        }}
      >
        {kopiert ? "Kopiert" : `Kopier soner (${scene.id})`}
      </button>
    </div>
  );
}
