/**
 * Frostrunene: Snøfall's invented script (gaater-2026, meta 1). Never real runes.
 * Each letter is a stem plus up to five features picked by the bits of its
 * position in the alphabet, so the 29 glyphs are unique and stable.
 */

export const RUNE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ".split("");

const FEATURES = [
  "M10 7 H4 V11", // bit 0: left hook
  "M10 7 H16 V3", // bit 1: right hook
  "M10 15 H15", // bit 2: half bar
  "M5 22 L10 18 L15 22", // bit 3: lower chevron
  "", // bit 4: ring at the foot (circle below)
];

interface FrostruneProps {
  letter: string;
  size?: number;
  className?: string;
}

export function Frostrune({ letter, size = 24, className }: FrostruneProps) {
  const n = RUNE_ALPHABET.indexOf(letter.toUpperCase()) + 1;
  if (n === 0) return <span className={className}>{letter}</span>;
  const d = ["M10 2 V22", ...FEATURES.filter((f, i) => f && n & (1 << i))];
  return (
    <svg
      viewBox="0 0 20 30"
      width={size}
      height={(size * 30) / 20}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      role="img"
      aria-label={letter}
    >
      <path d={d.join(" ")} />
      {n & 16 ? <circle cx={10} cy={26} r={2.5} /> : null}
    </svg>
  );
}

/** Letters not in `learned` become frost noise (null); spaces stay. */
export function maskRunes(
  text: string,
  learned?: Set<string>,
): (string | null)[] {
  return text
    .toUpperCase()
    .split("")
    .map((ch) => (ch === " " || !learned || learned.has(ch) ? ch : null));
}

/**
 * A line of text in runes (e.g. transcript_runer). Spaces stay spaces. With
 * `learned`, only those letters are drawn; the rest is frost noise.
 */
export function RuneText({
  text,
  size = 20,
  className,
  learned,
}: {
  text: string;
  size?: number;
  className?: string;
  learned?: Set<string>;
}) {
  const chars = maskRunes(text, learned);
  return (
    <span
      role="img"
      className={`inline-flex flex-wrap items-end gap-1 ${className ?? ""}`}
      aria-label={chars.map((c) => c ?? "*").join("")}
    >
      {chars.map((ch, i) =>
        ch === null ? (
          <span
            key={i}
            data-frost
            aria-hidden
            className="inline-flex items-center justify-center opacity-50"
            style={{ width: size, height: (size * 30) / 20 }}
          >
            ❄
          </span>
        ) : ch === " " ? (
          <span key={i} style={{ width: size / 2 }} />
        ) : (
          <Frostrune key={i} letter={ch} size={size} />
        ),
      )}
    </span>
  );
}
