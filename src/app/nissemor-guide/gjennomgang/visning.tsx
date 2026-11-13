"use client";

import Link from "next/link";
import { Lagremelding, useLagring } from "../lagring";
import { useEffect, useState, type ReactNode } from "react";
import { GameEngine } from "@/lib/game-engine";
import { TekstDiff } from "@/components/ui/TekstDiff";
import type { FeltDiff } from "@/lib/tekstdiff";
import { mediaUrl } from "@/lib/media";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";
import { ETAPPER } from "@/components/windows/snofall-tv/slede";
import { GrandFinaleModal } from "@/components/ui/GrandFinaleModal";
import videoer from "@/data/julius_videoer.json";
import radioManus from "@/data/radio-manus.json";
import type { dagInnhold } from "@/lib/guide-innhold";
import type { Sesong } from "../_kveld/felles";
import { Foreldredel, Rampestrek } from "../dag/[n]/foreldre";
import { Handleliste } from "../_kveld/handel";
import { Markdown } from "../historien/markdown";
import { Gaatekart } from "../dag/[n]/gaatekart";
import { utskriftHref, utskriftTittel } from "../printout/filer";
import { lagre, slug, SkjulVurder, useVurderinger, Vurder } from "../vurdering";
import type { Element } from "./elementer";
import { SegmentStripe } from "./segmentstripe";
import { BildeVersjoner } from "./bilder";
import { LysbordBilde } from "../lysbord";

type Dag = Awaited<ReturnType<typeof dagInnhold>>;

const ren = (s: string | undefined | null) =>
  (s ?? "").replace(/\*\*/g, "").replace(/`/g, "");
const lenke = "underline text-(--gold) inline-block min-h-11 py-2";

function Felt({ k, children }: { k: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mb-2">
      <h3 className="text-(--gold)">{k}</h3>
      <div className="whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function useDag(n: number | undefined) {
  const [dag, setDag] = useState<Dag | null>(null);
  useEffect(() => {
    if (!n) return;
    let aktiv = true;
    fetch(`/api/guide/dag/${n}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => aktiv && setDag(d));
    return () => {
      aktiv = false;
    };
  }, [n]);
  return dag?.dag === n ? dag : null;
}

/** Script per segment; with `port` each segment gets its own verdict (julius-dag.py's script gate). */
function Manus({ d, port }: { d: Dag; port?: boolean }) {
  const j = d.julius;
  if (!j) return <p>Ikke noe manus for dagen.</p>;
  const id = (s: number) =>
    `manus/julius/dag-${String(d.dag).padStart(2, "0")}#s${s}`;
  return (
    <SkjulVurder.Provider value={!port}>
      <p className="text-sm text-(--cold-blue) whitespace-pre-wrap mb-2">
        {ren(j.intro)}
      </p>

      <ol className="space-y-2">
        {j.segmenter.map((s, i) => {
          const m = d.manusport[i];
          const varsler = m?.varsler ?? s.varsler;
          return (
            <li key={i} className="border border-(--neon-green)/40 p-2">
              <p>
                <span className="text-(--gold)">{i + 1}.</span> «
                {ren(s.replikk)}»
              </p>
              <p className="text-sm">
                {s.ord} ord · {s.sek} s
                {s.laast && (
                  <span className="text-(--gold)"> · låst gåtebrikke</span>
                )}
                {varsler.length > 0 && (
                  <span className="text-(--christmas-red)">
                    {" "}
                    · {varsler.join("; ")}
                  </span>
                )}
              </p>
              <p className="text-sm">Handling: {ren(s.handling)}</p>
              {port && m && <Vurder id={id(m.s)} />}
            </li>
          );
        })}
      </ol>
    </SkjulVurder.Provider>
  );
}

/**
 * The top of a Julius script day: no verdict of its own. Status comes from the
 * segments; Godkjent/OK set every segment not marked Lag på nytt (the gate reads
 * #sK); the note is a day note on `manus/julius/dag-NN` and never opens the gate.
 */
/** Which «alle» button is met: every segment ✓ → godkjent; all ✓/◐ with a ◐ → ok. */
export function alleOppfylt(
  v: (string | undefined)[],
): "godkjent" | "ok" | null {
  if (!v.length || !v.every((x) => x === "godkjent" || x === "ok")) return null;
  return v.includes("ok") ? "ok" : "godkjent";
}

export function DagManus({ n }: { n: number }) {
  const d = useDag(n);
  const alle = useVurderinger();
  const { status, lagrer, kjør } = useLagring();
  const dagId = `manus/julius/dag-${String(n).padStart(2, "0")}`;
  const [notat, setNotat] = useState<string | null>(null);
  if (!d || !alle) return <p>Laster …</p>;
  const id = (s: number) => `${dagId}#s${s}`;
  const v = (s: number) => alle[id(s)]?.vurdering;
  const segs = d.manusport.map((m) => m.s);
  const godkjent = segs.filter((s) => ["godkjent", "ok"].includes(v(s) ?? ""));
  const nytt = segs.filter((s) => v(s) === "lag_paa_nytt");
  const alleTil = (verdikt: "godkjent" | "ok") => {
    const rest = segs.filter(
      (s) => v(s) !== "lag_paa_nytt" && v(s) !== verdikt,
    );
    if (
      nytt.length &&
      !confirm(`${nytt.length} er Lag på nytt — godkjenn resten?`)
    )
      return;
    void kjør(
      () =>
        Promise.all(
          rest.map((s) => lagre(id(s), verdikt, alle[id(s)]?.notat ?? "")),
        ),
      `✓ Lagret (${rest.length})`,
    );
  };
  const tekst = notat ?? alle[dagId]?.notat ?? "";
  const oppfylt = alleOppfylt(segs.map(v));
  const alleKnapp = (k: "godkjent" | "ok") =>
    `min-h-11 min-w-28 px-4 font-bold border-2 ${oppfylt === k ? "bg-(--gold) text-black border-(--gold)" : "border-(--neon-green) hover:bg-(--neon-green)/20"}`;
  return (
    <div id="vurdering-dagmanus" className="flex flex-wrap items-center gap-2">
      <p data-testid="manus-status" className="min-h-11 flex items-center">
        <span className="text-(--gold)">
          {godkjent.length} av {segs.length} godkjent
        </span>
        {nytt.length > 0 && (
          <span className="text-(--christmas-red)">
            {" "}
            · {nytt.map((s) => `s${s}`).join(", ")} lag på nytt
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-alle="godkjent"
          disabled={lagrer}
          aria-pressed={oppfylt === "godkjent"}
          onClick={() => alleTil("godkjent")}
          className={alleKnapp("godkjent")}
        >
          {oppfylt === "godkjent"
            ? "✓ Alle godkjent"
            : "Godkjenn alle segmentene"}
        </button>
        <button
          type="button"
          data-alle="ok"
          disabled={lagrer}
          aria-pressed={oppfylt === "ok"}
          onClick={() => alleTil("ok")}
          className={alleKnapp("ok")}
        >
          {oppfylt === "ok" ? "◐ Alle OK" : "OK på alle"}
        </button>
        <input
          type="text"
          value={tekst}
          placeholder="Notat for dagen (påvirker ikke porten), Enter lagrer"
          onChange={(e) => setNotat(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void kjør(() => lagre(dagId, null, tekst));
          }}
          className="flex-1 min-w-48 min-h-11 bg-black border-2 border-(--neon-green) px-3 text-sm"
        />
        <Lagremelding status={status} className="text-sm" />
      </div>
    </div>
  );
}

function Spiller({ path, vurderId }: { path: string; vurderId?: string }) {
  if (path.endsWith(".mp3"))
    return <audio src={mediaUrl(path)} controls className="w-full min-h-11" />;
  if (path.endsWith(".mp4"))
    return (
      <video
        key={path}
        src={mediaUrl(path)}
        controls
        className="w-full max-h-[60vh] bg-black border border-(--neon-green)/40"
      />
    );
  return (
    <LysbordBilde
      src={mediaUrl(path)}
      alt={path}
      vurderId={vurderId}
      className="max-h-72 min-h-32 border border-(--neon-green)/40"
    />
  );
}

/** Only what it takes to judge one element. */
export function Innhold({ e, sesong }: { e: Element; sesong: Sesong }) {
  const manusDag = e.id.match(/^manus\/julius\/dag-(\d+)/)?.[1];
  const radioDag = e.id.match(/^manus\/radio\/dag-(\d+)$/)?.[1];
  const n =
    e.dag ?? (manusDag || radioDag ? Number(manusDag ?? radioDag) : undefined);
  const dag = useDag(n);
  const [finale, setFinale] = useState(false);
  const t = (s: string) => ren(s);

  if (n && !dag) return <p>Laster …</p>;
  const q = dag?.oppdrag;

  if (dag && e.gruppe === "rampestrek")
    return (
      <>
        {!!e.eldre?.length && (
          <BildeVersjoner filer={[...e.media, ...e.eldre]} vurderId={e.id} />
        )}
        <Rampestrek
          n={n!}
          d={dag.kveld}
          t={t}
          gjennomgang={{ medVersjoner: !!e.eldre?.length }}
        />
      </>
    );
  if (dag && e.gruppe === "gaate" && dag.kveld)
    return (
      <Gaatekart
        vid={e.id}
        k={dag.kart}
        d={dag.kveld}
        epost={q?.nissemail_tekst ?? ""}
        vis
        kode={q?.kode}
        t={(s) => s}
      />
    );
  if (dag && e.gruppe === "julius")
    return (
      <>
        <p className="text-sm break-all">{e.id}</p>
        <SegmentStripe path={e.id}>
          <Spiller path={e.id} vurderId={e.id} />
        </SegmentStripe>
        {!!e.eldre?.length && (
          <details className="my-2">
            <summary className="min-h-11 py-2 cursor-pointer">
              Eldre versjoner ({e.eldre.length})
            </summary>
            {e.eldre.map((p) => (
              <div key={p} className="mb-2">
                <p className="text-sm break-all">{p}</p>
                <Spiller path={p} />
              </div>
            ))}
          </details>
        )}
        <Felt k="Transkripsjon">
          {videoer.find((v) => v.dag === n)?.transkripsjon}
        </Felt>
        <h3 className="text-(--gold)">Manus</h3>
        <Manus d={dag} />
      </>
    );
  if (dag && manusDag) return <Manus d={dag} port />;
  if (dag && radioDag) {
    const m = (
      radioManus as Record<string, { tekst: string; ord: number; sek: number }>
    )[String(n)];
    return (
      <>
        <p className="text-sm">
          {m?.ord ?? 0} ord · ca. {m?.sek ?? 0} s
        </p>
        <Felt k="Klipp (det TTS leser)">{m?.tekst}</Felt>
        <Felt k="Strek">
          <span className="text-(--gold)">{ren(dag.radio?.strek)}</span>
        </Felt>
        <Felt k="Rampestrek (Varden)">{ren(dag.radio?.rampestrek_hint)}</Felt>
        <Felt k="Lydregi">{ren(dag.radio?.lydregi)}</Felt>
      </>
    );
  }
  if (dag && e.gruppe === "radio")
    return (
      <>
        <Spiller path={e.id} vurderId={e.id} />
        <Link
          className={lenke}
          href={`/nissemor-guide/gjennomgang?id=${encodeURIComponent(`manus/radio/dag-${String(n).padStart(2, "0")}`)}`}
        >
          Radiomanus dag {n}
        </Link>
        {(
          [
            ["Strek", dag.radio?.strek],
            ["Introlinje", dag.radio?.intro_hint],
            ["Reaksjon", dag.radio?.reaksjon_hint],
            ["Lydregi", dag.radio?.lydregi],
            ["Klipp", dag.radio?.klipp],
          ] as const
        ).map(([k, v]) => (
          <Felt key={k} k={k}>
            {ren(v)}
          </Felt>
        ))}
      </>
    );
  if (dag && e.gruppe === "tekster")
    return (
      <>
        <Felt k="NisseMail">{ren(q?.nissemail_tekst)}</Felt>
        <Felt k="PS">{ren(q?.julius_ps)}</Felt>
        <Felt k="PS med bonus">{ren(q?.julius_ps_bonus)}</Felt>
        <Felt k="PS når krypto mangler">
          {ren(q?.julius_ps_krypto_mangler)}
        </Felt>
        <Felt k="Varsler">{dag.varsler.map((a) => a.tekst).join("\n")}</Felt>
        {dag.filer.map((f) => (
          <Felt key={f.sti} k={`NisseNet: ${f.sti}`}>
            {f.innhold}
          </Felt>
        ))}
      </>
    );
  if (dag && e.gruppe === "utskrifter") {
    const filer = [
      ...(dag.kveld?.utskrifter ?? []),
      ...(dag.kveld?.reservesett ? [dag.kveld.reservesett] : []),
    ];
    return (
      <>
        <p>{ren(dag.kveld?.utskrifterTekst)}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {filer.map((u) => (
            <div key={u}>
              <Link href={utskriftHref(u)} className={lenke}>
                {utskriftTittel(u)}
              </Link>
              <iframe
                src={utskriftHref(u)}
                title={utskriftTittel(u)}
                loading="lazy"
                className="w-full h-80 bg-white border border-(--neon-green)/40"
              />
            </div>
          ))}
        </div>
      </>
    );
  }
  if (dag && e.gruppe === "oppsett")
    return <Foreldredel n={n!} d={dag.kveld} t={t} bareKveld />;

  const [del, nr] = e.id.split("/");
  if (del === "ugleposten") {
    const k = KAPITLER.find((x) => `k${x.n}` === nr)!;
    const piksel = (b: string) =>
      b.replace(/^spill\/(.+)\.\w+$/, "spill/piksel/$1.png");
    const figurer = [
      ...new Set(
        k.scener.flatMap((s) => s.hotspots.flatMap((h) => h.figur ?? [])),
      ),
    ];
    return (
      <>
        <p>
          Åpner dag {k.dag}
          {!k.klar && " (skisse)"}. Spill det i NisseKomm:{" "}
          <Link href="/" className={lenke}>
            åpne barnas skjerm
          </Link>{" "}
          (Ugleposten).
        </p>
        <Felt k="Intro">{k.intro.join("\n")}</Felt>
        <h3 className="text-(--gold)">Scener</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {k.scener.map((s) => (
            <figure key={s.id}>
              <LysbordBilde
                gruppe="scener"
                src={mediaUrl(piksel(s.bilde))}
                alt={s.navn}
                loading="lazy"
                className="w-full border border-(--neon-green)/40"
                onError={(ev) => (ev.currentTarget.src = mediaUrl(s.bilde))}
              />
              <figcaption className="text-sm">{s.navn}</figcaption>
            </figure>
          ))}
        </div>
        <h3 className="text-(--gold)">Figurer og ikoner</h3>
        <div className="flex flex-wrap gap-3">
          {[
            ...figurer.map((f) => [`spill/piksel/figur/${f}.png`, f]),
            ...Object.values(k.gjenstander).map((g) => [
              `spill/piksel/ikon/${g.id}.png`,
              g.navn,
            ]),
          ].map(([p, navn]) => (
            <figure key={p} className="w-20 text-center text-sm">
              <LysbordBilde
                gruppe="ikoner"
                src={mediaUrl(p)}
                alt={navn}
                loading="lazy"
                className="w-16 h-16 mx-auto object-contain [image-rendering:pixelated] border border-(--neon-green)/40"
              />
              <figcaption>{navn}</figcaption>
            </figure>
          ))}
        </div>
      </>
    );
  }
  if (del === "sledeflukt") {
    const s = ETAPPER.find((x) => x.id === nr);
    return (
      <>
        {s && <Felt k={`${s.navn} (fra dag ${s.dag})`}>{s.intro}</Felt>}
        {s && <Spiller path={`feed/slede-${s.id}.jpg`} />}
        <Link href={`/dev/sledeflukt?dag=24`} className={lenke}>
          Fly i /dev/sledeflukt
        </Link>
      </>
    );
  }
  if (e.gruppe === "Snøfall TV") return <Spiller path={e.id} vurderId={e.id} />;
  if (del === "finale")
    return (
      <>
        <button
          type="button"
          onClick={() => setFinale(true)}
          className="min-h-11 px-4 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
        >
          Vis finalen
        </button>
        {finale && <GrandFinaleModal onClose={() => setFinale(false)} />}
        <Link
          href="/nissemor-guide/printout/diplom"
          className={`${lenke} ml-4`}
        >
          Diplom
        </Link>
        <iframe
          src="/nissemor-guide/printout/diplom"
          title="Diplom"
          className="w-full h-96 bg-white mt-2"
        />
      </>
    );
  if (del === "symboler")
    return (
      <>
        <Link href="/nissemor-guide/symboler" className={lenke}>
          Symbolkortene
        </Link>
        <iframe
          src="/nissemor-guide/symboler"
          title="Symbolkort"
          className="w-full h-[70vh] bg-white"
        />
      </>
    );
  if (del === "krypto") {
    const k = GameEngine.getAllQuests().filter((x) => x.decryption_challenge)[
      Number(nr) - 1
    ];
    const c = k?.decryption_challenge;
    if (!c) return null;
    return (
      <>
        <Felt k={`Dag ${k.dag}: ${c.challengeId}`}>{c.hint}</Felt>
        <Felt k="Symboler i riktig rekkefølge">
          {c.correctSequence.map((i) => c.requiredSymbols[i]).join(" → ")}
        </Felt>
        <Felt k="Belønning">{c.rewardText}</Felt>
      </>
    );
  }
  if (del === "forsesong") {
    const f = sesong.for;
    if (nr === "byggeplan")
      return f.byggeplan.map((b) => (
        <Felt key={b.tittel} k={b.tittel}>
          {b.steg.map((s) => `- ${s.tekst} (${s.min} min)`).join("\n")}
        </Felt>
      ));
    if (nr === "handleliste")
      return <Handleliste varer={f.handleliste.varer} />;
    return <p>{f.radio.find((r) => r.dato === nr)?.tekst}</p>;
  }
  if (del === "historien") {
    const h = sesong.historien.find((x) => slug(x.tittel) === nr);
    return <Markdown tekst={h?.deler.join("\n\n") ?? ""} />;
  }
  if (e.gruppe === "Promo") {
    const x = e.id.match(/julius-promo-([AB])/)?.[1];
    return (
      <>
        <Spiller path={e.id} vurderId={e.id} />
        <p className="whitespace-pre-wrap mt-2">
          {ren(sesong.promo.find((p) => p.id === x)?.tekst)}
        </p>
      </>
    );
  }
  // Files with no section of their own (icons, figures, portraits, music …).
  if (e.media.length) {
    const bilde = /\.(png|jpe?g|webp)$/.test(e.id);
    return bilde && e.eldre?.length ? (
      <BildeVersjoner filer={[e.id, ...e.eldre]} vurderId={e.id} />
    ) : (
      <Spiller path={e.id} vurderId={e.id} />
    );
  }
  return null;
}

/** As lib/historikk.ts serves it (server-only, so not imported here). */
type Hendelse = {
  t: string;
  hvem: "Hans" | "agent" | "maskin";
  hva: string;
  tekst: string;
  diff?: string;
  felter?: FeltDiff[];
};
const HVEM_FARGE = {
  Hans: "text-(--gold)",
  agent: "text-(--cold-blue)",
  maskin: "text-(--gray)",
} as const;

/** «Historikk ▸»: folded, fetched on first open, newest first. */
export function Historikk({ id }: { id: string }) {
  const [h, setH] = useState<Hendelse[] | null | "feil">(null);
  return (
    <details
      className="my-4 border-t border-(--neon-green)/40"
      data-testid="historikk"
      onToggle={(ev) => {
        if (!(ev.currentTarget as HTMLDetailsElement).open || h) return;
        fetch(`/api/media/historikk?id=${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then(setH, () => setH("feil"));
      }}
    >
      <summary className="min-h-11 py-2 cursor-pointer text-xl">
        Historikk
      </summary>
      {h === null ? (
        <p>Laster …</p>
      ) : h === "feil" ? (
        <p className="text-(--christmas-red)">Fikk ikke hentet historikken.</p>
      ) : !h.length ? (
        <p>Ingen historikk ennå.</p>
      ) : (
        <ol className="space-y-1 text-base">
          {h.map((x, i) => (
            <li key={i} className="break-words">
              <span className="opacity-70">
                {x.t.slice(0, 16).replace("T", " ")}
              </span>{" "}
              <span className={HVEM_FARGE[x.hvem]}>{x.hvem}</span> · {x.hva} ·{" "}
              {x.tekst}
              {x.felter?.length ? <TekstDiff felter={x.felter} /> : null}
              {x.diff && (
                <details>
                  <summary className="min-h-11 py-2 cursor-pointer">
                    {x.felter?.length ? "vis rå diff" : "Diff"}
                  </summary>
                  <pre className="whitespace-pre-wrap text-sm">{x.diff}</pre>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
