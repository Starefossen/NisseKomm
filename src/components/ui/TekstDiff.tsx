import type { FeltDiff } from "@/lib/tekstdiff";

/** Word diff per field: removed red and struck, added green, long unchanged runs folded, moved text marked. */
export function TekstDiff({ felter }: { felter: FeltDiff[] }) {
  return (
    <div className="space-y-1" data-testid="tekstdiff">
      {felter.map((f) => (
        <p key={f.felt} className="break-words text-sm">
          <b className="text-(--cold-blue)">{f.felt}:</b>{" "}
          {f.deler.map((d, i) =>
            d.t === "=" ? (
              <span key={i}>{d.s} </span>
            ) : d.t === "…" ? (
              <span key={i} className="opacity-60">
                … {d.n} ord uendret …{" "}
              </span>
            ) : d.t === "f" ? (
              <span key={i} className="opacity-70">
                [{d.dir === "til" ? "flyttet til" : "flyttet fra"} {d.felt}:{" "}
                {d.s}]{" "}
              </span>
            ) : d.t === "+" ? (
              <span key={i} className="text-(--aurora) bg-(--aurora)/10">
                {d.s}{" "}
              </span>
            ) : (
              <span key={i} className="text-(--christmas-red) line-through">
                {d.s}{" "}
              </span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
