"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { GameEngine } from "@/lib/game-engine";
import { mediaUrl } from "@/lib/media";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";
import { ETAPPER } from "@/components/windows/snofall-tv/slede";
import { GrandFinaleModal } from "@/components/ui/GrandFinaleModal";
import videoer from "@/data/julius_videoer.json";
import type { dagInnhold } from "@/lib/guide-innhold";
import type { Sesong } from "../_kveld/felles";
import { Foreldredel, Rampestrek } from "../dag/[n]/foreldre";
import { Gaatekart } from "../dag/[n]/gaatekart";
import { utskriftHref, utskriftTittel } from "../printout/filer";
import { slug } from "../vurdering";
import type { Element } from "./elementer";

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

function Manus({ j }: { j: Dag["julius"] }) {
  if (!j) return <p>Ikke noe manus for dagen.</p>;
  return (
    <>
      <p className="text-sm text-(--cold-blue) whitespace-pre-wrap mb-2">
        {ren(j.intro)}
      </p>
      <ol className="space-y-2">
        {j.segmenter.map((s, i) => (
          <li key={i} className="border border-(--neon-green)/40 p-2">
            <p>
              <span className="text-(--gold)">{i + 1}.</span> «{ren(s.replikk)}»
            </p>
            <p className="text-sm">
              {s.ord} ord · {s.sek} s{s.laast && " · låst brikke"}
              {s.varsler.length > 0 && (
                <span className="text-(--christmas-red)">
                  {" "}
                  · {s.varsler.join("; ")}
                </span>
              )}
            </p>
            <p className="text-sm">Handling: {ren(s.handling)}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

function Spiller({ path }: { path: string }) {
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
    // eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR, not in the build
    <img
      src={mediaUrl(path)}
      alt={path}
      className="max-h-72 border border-(--neon-green)/40"
    />
  );
}

/** Only what it takes to judge one element. */
export function Innhold({ e, sesong }: { e: Element; sesong: Sesong }) {
  const manusDag = e.id.match(/^manus\/julius\/dag-(\d+)/)?.[1];
  const n = e.dag ?? (manusDag ? Number(manusDag) : undefined);
  const dag = useDag(n);
  const [finale, setFinale] = useState(false);
  const t = (s: string) => ren(s);

  if (n && !dag) return <p>Laster …</p>;
  const q = dag?.oppdrag;

  if (dag && e.gruppe === "rampestrek")
    return <Rampestrek n={n!} d={dag.kveld} t={t} />;
  if (dag && e.gruppe === "gaate" && dag.kveld)
    return (
      <Gaatekart
        vid={e.id}
        k={dag.kart}
        d={dag.kveld}
        epost={q?.nissemail_tekst ?? ""}
        vis
        t={(s) => s}
      />
    );
  if (dag && e.gruppe === "julius")
    return (
      <>
        <p className="text-sm break-all">{e.id}</p>
        <Spiller path={e.id} />
        <Felt k="Transkripsjon">
          {videoer.find((v) => v.dag === n)?.transkripsjon}
        </Felt>
        <h3 className="text-(--gold)">Manus</h3>
        <Manus j={dag.julius} />
      </>
    );
  if (dag && manusDag) return <Manus j={dag.julius} />;
  if (dag && e.gruppe === "radio")
    return (
      <>
        <Spiller path={e.id} />
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
    return <Foreldredel n={n!} d={dag.kveld} t={t} plan={dag.byggeplan} />;

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
              {/* eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR */}
              <img
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
              {/* eslint-disable-next-line @next/next/no-img-element -- MEDIA_DIR */}
              <img
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
  if (e.gruppe === "Snøfall TV") return <Spiller path={e.id} />;
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
      return f.handleliste.grupper.map((g) => (
        <Felt key={g.navn} k={g.navn}>
          {g.varer
            .map(
              (v) =>
                `- ${v.vare}${v.mengde ? ` · ${v.mengde}` : ""}${v.pris ? ` · ${v.pris}` : ""}`,
            )
            .join("\n")}
        </Felt>
      ));
    return <p>{f.radio.find((r) => r.dato === nr)?.tekst}</p>;
  }
  if (del === "historien") {
    const h = sesong.historien.find((x) => slug(x.tittel) === nr);
    return <p className="whitespace-pre-wrap">{ren(h?.deler.join("\n\n"))}</p>;
  }
  if (e.gruppe === "Promo") {
    const x = e.id.match(/julius-promo-([AB])/)?.[1];
    return (
      <>
        <Spiller path={e.id} />
        <p className="whitespace-pre-wrap mt-2">
          {ren(sesong.promo.find((p) => p.id === x)?.tekst)}
        </p>
      </>
    );
  }
  return null;
}
