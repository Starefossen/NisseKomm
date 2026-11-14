"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { type Sesong } from "../_kveld/felles";
import { useData, useKo } from "./celle";
import { taggTelling } from "@/lib/vurdering-tagger";
import { TRENGER, type TrengerHva } from "@/lib/trenger";
import { FREMDRIFT, prioritetFor, prioritetTekst, type Linje } from "./ko";
import { Fremdriftslinjer } from "./fremdrift";
import { Forslag, Regler } from "./laerdom";
import { FANER, Fane, SIDE, href, knapp, kr } from "./felles";

export function Ko({
  d,
  sesong,
}: {
  d: ReturnType<typeof useData>;
  sesong: Sesong;
}) {
  const router = useRouter();
  const { liste, ko, fd } = useKo(d, sesong);
  const fraUrl = useSearchParams().get("k");
  const fane: Fane = FANER.some(([f]) => f === fraUrl)
    ? (fraUrl as Fane)
    : "venter";
  const [valgt, setValgt] = useState(0);
  const sp = useSearchParams();
  const st = FREMDRIFT.find(([k]) => k === sp.get("s"));
  const g = sp.get("g");

  // `p=1`: only the agents' priorities (the counter's link).
  const bareP = sp.get("p") === "1";
  const pr = d.server?.prioriteter ?? {};
  const linjer: Linje[] = !ko
    ? []
    : st
      ? fd!.poster
          .filter((p) => p.status === st[0] && (!g || p.type === g))
          .map((p) => ({
            ...p,
            hva: `${st[1]} · ${p.type}`,
            prioritet: prioritetFor(
              p.id,
              pr,
              liste.find((e) => e.id === p.id)?.media,
            ),
          }))
      : bareP
        ? ko.venter.filter((l) => l.prioritet)
        : ko[fane];
  const beslutninger =
    ko?.venter.filter((l) => l.type === "beslutning").length ?? 0;
  const antallP = new Set(
    ko?.venter.filter((l) => l.prioritet).map((l) => l.prioritet!.fil),
  ).size;
  const lenke = (l: Linje) =>
    liste.some((e) => e.id === l.id) || l.id.startsWith("beslutning/")
      ? href(l.id, (l.seg ? `&s=${l.seg}` : "") + (st ? "" : `&k=${fane}`))
      : "/nissemor-guide/media";

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      const mal = ev.target as HTMLElement;
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(mal.tagName)
      )
        return;
      const tast = ev.key.toLowerCase();
      if (tast === "n" || tast === "j")
        setValgt((i) => Math.min(i + 1, linjer.length - 1));
      else if (tast === "p") setValgt((i) => Math.max(i - 1, 0));
      else if (ev.key === "Enter" && linjer[valgt])
        router.push(lenke(linjer[valgt]));
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  });
  useEffect(() => {
    document
      .querySelector(`[data-ko="${valgt}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [valgt]);

  if (!ko) return <p>Laster køen …</p>;
  const f = d.server!.forbruk;
  const grupper =
    fane === "laerdom" ? [...new Set(linjer.map((l) => l.type))] : [null];
  return (
    <>
      <p className="text-lg" data-testid="budsjett">
        Forbruk siden {Number(f.fra.slice(8))}.{Number(f.fra.slice(5, 7))}.:{" "}
        <span className="text-(--gold)">{kr(f.brukt)} kr</span> brukt,{" "}
        <span className={f.igjen < 200 ? "text-(--christmas-red)" : ""}>
          {kr(f.igjen)} kr
        </span>{" "}
        igjen av {kr(f.budsjett)} kr
      </p>
      {fd && <Fremdriftslinjer total={fd.total} typer={fd.typer} side={SIDE} />}
      {antallP > 0 && !bareP && (
        <p className="text-lg" data-testid="prioritert">
          <Link
            href={`${SIDE}?k=venter&p=1`}
            className="underline text-(--christmas-red)"
          >
            {antallP} prioritert
          </Link>
        </p>
      )}
      {bareP && (
        <p className="text-lg">
          Viser prioritert ({linjer.length}).{" "}
          <Link href={SIDE} className="underline text-(--gold)">
            Tilbake til køen
          </Link>
        </p>
      )}
      {st && (
        <p className="text-lg">
          Viser {st[1].toLowerCase()}
          {g ? ` · ${g}` : ""} ({linjer.length}).{" "}
          <Link href={SIDE} className="underline text-(--gold)">
            Tilbake til køen
          </Link>
        </p>
      )}
      <nav className="flex flex-wrap gap-2" role="tablist">
        {FANER.map(([k, navn]) => (
          <Link
            key={k}
            role="tab"
            aria-selected={!st && fane === k}
            href={`${SIDE}?k=${k}`}
            onClick={() => setValgt(0)}
            className={`${knapp} text-lg ${!st && fane === k ? "bg-(--gold) text-black border-(--gold)" : ""}`}
          >
            {/* Same number as the progress bar: elements, not lines (a video can have several segment lines). */}
            {navn} (
            {k === "laerdom" || k === "arbeid"
              ? ko[k].length
              : fd!.total.telling[k]}
            {k === "venter" && beslutninger > 0 && ` + ${beslutninger} spm.`})
          </Link>
        ))}
      </nav>
      {fane === "venter" && ko.segmenter > 0 && (
        <p className="text-base">
          Herav {ko.segmenter} manussegmenter på dager uten video.
        </p>
      )}
      {fane === "laerdom" && d.server!.laerdom && (
        <Regler d={d.server!.laerdom} ny={d.settLaerdom} />
      )}
      {fane === "laerdom" && (
        <div data-testid="tagg-telling">
          {Object.keys(ko.trengerTelling).length > 0 && (
            <p data-testid="trenger-telling">
              <span className="text-(--gold)">Trenger mer:</span>{" "}
              {Object.entries(ko.trengerTelling)
                .map(([h, n]) => `${TRENGER[h as TrengerHva]} ${n}`)
                .join(" · ")}
            </p>
          )}
          {taggTelling(d.vurd ?? {}).map(([t, n]) => (
            <p key={t}>
              <span className="text-(--gold)">Merker {t}:</span>{" "}
              {n.map(([x, k]) => `${x} ${k}`).join(" · ")}
            </p>
          ))}
        </div>
      )}
      {linjer.length === 0 && <p>Ingenting her.</p>}
      {grupper.map((g) => (
        <div key={g ?? "alle"}>
          {g && <h2 className="text-2xl text-(--gold) mt-3">{g}</h2>}
          <ul>
            {linjer.map((l, i) =>
              g && l.type !== g ? null : (
                <li
                  key={`${l.id}-${l.tittel}-${l.hva}`}
                  data-ko={i}
                  aria-current={i === valgt}
                  className={`border-b border-(--neon-green)/30 p-2 ${i === valgt ? "bg-(--neon-green)/15 border-l-4 border-l-(--gold)" : ""}`}
                >
                  <Link
                    href={lenke(l)}
                    className="underline text-(--gold) inline-block min-h-11 py-2 break-all"
                  >
                    {l.tittel}
                  </Link>{" "}
                  <span className={l.feil ? "text-(--christmas-red)" : ""}>
                    {l.hva}
                  </span>
                  {l.prioritet && (
                    <p className="text-base text-(--christmas-red)">
                      {prioritetTekst(l.prioritet)}
                    </p>
                  )}
                  {l.notat && <p className="text-base">«{l.notat}»</p>}
                  {fane === "laerdom" && <Forslag l={l} ny={d.settLaerdom} />}
                  {l.kommando && (
                    <p className="text-base">
                      <code className="break-all text-(--cold-blue)">
                        {l.kommando}
                      </code>
                      {l.pris ? ` · ca. ${kr(l.pris)} kr` : " · gratis"}
                    </p>
                  )}
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
      <p className="text-base text-(--neon-green)/80">
        Tastatur: N neste · P forrige · Enter åpner
      </p>
    </>
  );
}
