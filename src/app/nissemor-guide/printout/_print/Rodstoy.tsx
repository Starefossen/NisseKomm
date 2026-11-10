import type { ReactNode } from "react";

/**
 * Red scribble noise with cyan content underneath: unreadable to the eye,
 * clear through the red filter (red vanishes, cyan turns dark). Day 10.
 * Seeded, so every print is identical.
 */
export function Rodstoy({
  tetthet = 70,
  children,
}: {
  tetthet?: number;
  children?: ReactNode;
}) {
  let s = 90;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const streker = Array.from({ length: tetthet }, () => {
    const x = r() * 100;
    const y = r() * 60;
    return `M${x} ${y} q${r() * 30 - 15} ${r() * 30 - 15} ${r() * 40 - 20} ${r() * 30 - 15}`;
  });
  return (
    <div className="relative w-full h-full flex items-center justify-center text-[#00c8e8]">
      {children}
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <path
          d={streker.join(" ")}
          stroke="#ff2a2a"
          strokeWidth="2.2"
          fill="none"
        />
      </svg>
    </div>
  );
}
