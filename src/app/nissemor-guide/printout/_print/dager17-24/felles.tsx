import { Frostrune } from "@/components/ui/Frostrune";
import { Iskrystall } from "../dager01-12/felles";

export { Iskrystall };
export { Prikker } from "../dager01-12/felles";

/*
 * Card faces for days 17–24. Every card carries its letter's rune in the
 * corner, ❄ cards via `tegn` (gaater-2026 Meta 1); decoys pass none.
 */
export function Kort({
  bokstav,
  tegn,
  vis = "begge",
  nr,
  stor = 30,
}: {
  /** null = ❄ */
  bokstav: string | null;
  /** Corner rune on a ❄ card: the hidden letter. */
  tegn?: string;
  /** "tegn" = rune only, big in the middle (the board must be used). */
  vis?: "begge" | "tegn";
  nr?: string | number;
  /** Letter height in mm. */
  stor?: number;
}) {
  return (
    <div className="h-full relative flex items-center justify-center font-retro leading-none">
      {nr !== undefined && (
        <span className="absolute bottom-[1.5mm] left-[2mm] text-[3.5mm] text-gray-400">
          {nr}
        </span>
      )}
      {bokstav === null ? (
        <>
          {tegn && (
            <span className="absolute top-[2mm] right-[2mm]">
              <Frostrune letter={tegn} size={stor * 0.7} />
            </span>
          )}
          <Iskrystall size={stor * 3.2} />
        </>
      ) : vis === "tegn" ? (
        <Frostrune letter={bokstav} size={stor * 2.2} />
      ) : (
        <>
          <span className="absolute top-[2mm] right-[2mm]">
            <Frostrune letter={bokstav} size={stor * 0.7} />
          </span>
          <span style={{ fontSize: `${stor}mm` }}>{bokstav}</span>
        </>
      )}
    </div>
  );
}

/** Empty numbered squares the kids lay cards into. */
export function Rutekort({ n }: { n: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-[2mm] font-retro">
      <div className="text-[5mm] tracking-widest">NISSEKOMM ▸ RUTEKORT</div>
      <div className="flex gap-[1.5mm]">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="w-[18mm] h-[22mm] border-[0.6mm] border-black text-[3.5mm] text-gray-400 p-[0.5mm]"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export const midt = (n: React.ReactNode) => (
  <div className="h-full flex items-center justify-center">{n}</div>
);
