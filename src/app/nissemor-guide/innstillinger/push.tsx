"use client";

import { useEffect, useState } from "react";

const TYPER = [
  ["kveld", "I kveld kl. 20: hva som skal settes opp"],
  ["kode", "Dagens kode er løst"],
  ["feil", "Feil fra skjermene og synkroniseringen"],
  ["agent", "En agent trenger svar"],
] as const;

const knapp =
  "px-4 min-h-11 border-2 border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20";

const b64 = (s: string) => {
  const r = atob(
    (s + "=".repeat((4 - (s.length % 4)) % 4))
      .replace(/-/g, "+")
      .replace(/_/g, "/"),
  );
  return Uint8Array.from(r, (c) => c.charCodeAt(0));
};

async function abonnement() {
  const reg =
    await navigator.serviceWorker?.getRegistration("/nissemor-guide/");
  return { reg, sub: (await reg?.pushManager.getSubscription()) ?? null };
}

const json = (body: unknown) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Web push for this device (installed guide; iOS 16.4+ from the Home Screen). */
export function PushVarsler() {
  const [nøkkel, setNøkkel] = useState<string | null | undefined>(undefined);
  const [typer, setTyper] = useState<string[] | null>(null);
  const [melding, setMelding] = useState("");
  const støttet =
    typeof window !== "undefined" &&
    "PushManager" in window &&
    window.isSecureContext;

  useEffect(() => {
    if (!støttet) return;
    abonnement().then(async ({ sub }) => {
      const q = sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : "";
      const d: { publicKey?: string; typer?: string[] } = await fetch(
        `/api/push${q}`,
      ).then((r) => (r.ok ? r.json() : {}));
      setNøkkel(d.publicKey ?? null);
      setTyper(d.typer ?? null);
    });
  }, [støttet]);

  if (!støttet)
    return (
      <p>
        Varsler krever at guiden er lagt til på Hjem-skjermen (iPhone: Del →
        Legg til på Hjem-skjerm) og åpnet derfra over https.
      </p>
    );
  if (nøkkel === undefined) return null;
  if (!nøkkel)
    return <p>Varsler er ikke satt opp på serveren (VAPID-nøkler mangler).</p>;

  const lagre = async (nye: string[]) => {
    const { reg, sub: gammel } = await abonnement();
    if (!reg)
      return setMelding("Guiden er ikke installert ennå. Last siden på nytt.");
    if ((await Notification.requestPermission()) !== "granted")
      return setMelding("Varsler er ikke tillatt for guiden.");
    const sub =
      gammel ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64(nøkkel),
      }));
    const r = await fetch("/api/push", {
      method: "POST",
      ...json({ subscription: sub.toJSON(), typer: nye }),
    });
    setTyper(r.ok ? nye : typer);
    setMelding(r.ok ? "Lagret." : `Feil: ${r.status}`);
  };

  const slåAv = async () => {
    const { sub } = await abonnement();
    if (sub) {
      await fetch("/api/push", {
        method: "DELETE",
        ...json({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setTyper(null);
    setMelding("Varsler er slått av på denne telefonen.");
  };

  const test = async () => {
    const { sub } = await abonnement();
    const r =
      sub &&
      (await fetch("/api/push/test", {
        method: "POST",
        ...json({ endpoint: sub.endpoint }),
      }));
    setMelding(
      r && r.ok ? "Testvarsel sendt." : "Kunne ikke sende testvarsel.",
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {!typer ? (
        <button className={knapp} onClick={() => lagre(TYPER.map(([t]) => t))}>
          Slå på varsler
        </button>
      ) : (
        <>
          {TYPER.map(([t, tekst]) => (
            <label key={t} className="flex items-center gap-2 min-h-11">
              <input
                type="checkbox"
                className="w-6 h-6 accent-(--gold)"
                checked={typer.includes(t)}
                onChange={(e) =>
                  lagre(
                    e.target.checked
                      ? [...typer, t]
                      : typer.filter((x) => x !== t),
                  )
                }
              />
              {tekst}
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button className={knapp} onClick={test}>
              Send testvarsel
            </button>
            <button className={knapp} onClick={slåAv}>
              Slå av varsler
            </button>
          </div>
        </>
      )}
      {melding && <p>{melding}</p>}
    </div>
  );
}
