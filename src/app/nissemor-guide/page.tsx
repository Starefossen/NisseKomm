"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllOppdrag } from "@/lib/oppdrag-loader";
import { StorageManager } from "@/lib/storage";

const allOppdrag = getAllOppdrag();

// Validate that quest data loaded correctly
if (allOppdrag.length !== 24) {
  console.error(`Expected 24 quests, got ${allOppdrag.length}`);
}

function NissemorGuideContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [antennaConfirmed, setAntennaConfirmed] = useState(() => {
    if (typeof window !== "undefined") {
      return StorageManager.getCrisisStatus().antenna;
    }
    return false;
  });
  const [inventoryConfirmed, setInventoryConfirmed] = useState(() => {
    if (typeof window !== "undefined") {
      return StorageManager.getCrisisStatus().inventory;
    }
    return false;
  });
  const [letterInput, setLetterInput] = useState("");
  const [currentLetterDay, setCurrentLetterDay] = useState(1);

  const expectedKey = process.env.NEXT_PUBLIC_PARENT_GUIDE_KEY || "NORDPOL2025";
  const key = searchParams.get("key");
  const authenticated = key === expectedKey;

  useEffect(() => {
    if (!authenticated) {
      router.push("/");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return null;
  }

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    );
  };

  const toggleDay = (day: number) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleAntennaCrisisConfirm = () => {
    StorageManager.resolveCrisis("antenna");
    setAntennaConfirmed(true);
  };

  const handleInventoryCrisisConfirm = () => {
    StorageManager.resolveCrisis("inventory");
    setInventoryConfirmed(true);
  };

  const handleAddLetter = () => {
    const content = letterInput.trim();

    if (!content) {
      alert("Brevet kan ikke være tomt!");
      return;
    }

    if (currentLetterDay < 1 || currentLetterDay > 24) {
      alert("Dag må være mellom 1 og 24!");
      return;
    }

    try {
      StorageManager.addSantaLetter(currentLetterDay, content);
      setLetterInput("");
      alert(`✓ Brev for dag ${currentLetterDay} lagret!`);
    } catch (error) {
      console.error("Failed to save letter:", error);
      alert("Kunne ikke lagre brevet. Prøv igjen.");
    }
  };

  const weeks = [
    { num: 1, days: allOppdrag.slice(0, 7), title: "Uke 1: Oppdagelse" },
    { num: 2, days: allOppdrag.slice(7, 14), title: "Uke 2: Etterforskning" },
    { num: 3, days: allOppdrag.slice(14, 21), title: "Uke 3: Detektiv" },
    { num: 4, days: allOppdrag.slice(21, 24), title: "Uke 4: Finale" },
  ];

  const getSetupBadgeColor = (tid: string) => {
    switch (tid) {
      case "enkel":
        return "bg-green-600";
      case "moderat":
        return "bg-yellow-600";
      case "avansert":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8 pt-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🎄 NISSEMOR GUIDE 🎄
        </h1>
        <p className="text-center text-xl opacity-70">
          Oppsett og gjennomføring av julekalenderen
        </p>
      </div>

      {/* Weekly Sections */}
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {weeks.map((week) => (
          <div key={week.num} className="border-4 border-(--neon-green)">
            {/* Week Header */}
            <button
              onClick={() => toggleWeek(week.num)}
              className="w-full p-4 bg-(--neon-green) text-black font-bold text-2xl flex items-center justify-between hover:opacity-90"
            >
              <span>{week.title}</span>
              <span className="text-3xl">
                {expandedWeeks.includes(week.num) ? "▼" : "▶"}
              </span>
            </button>

            {/* Week Content */}
            {expandedWeeks.includes(week.num) && (
              <div className="p-4 space-y-4">
                {/* Days */}
                {week.days.map((dag) => (
                  <div
                    key={dag.dag}
                    className="border-2 border-(--neon-green)/50"
                  >
                    {/* Day Header */}
                    <button
                      onClick={() => toggleDay(dag.dag)}
                      className="w-full p-3 bg-(--dark-crt) flex flex-col items-start hover:bg-(--neon-green)/10"
                    >
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-xl font-bold">
                          DAG {dag.dag}: {dag.tittel}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-sm ${getSetupBadgeColor(dag.oppsett_tid)} text-white`}
                          >
                            {dag.oppsett_tid.toUpperCase()}
                          </span>
                          <span className="text-2xl">
                            {expandedDays.includes(dag.dag) ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {dag.materialer_nødvendig.map((materiale, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-(--neon-green)/20 border border-(--neon-green)/50"
                          >
                            {materiale}
                          </span>
                        ))}
                      </div>
                    </button>

                    {/* Day Content */}
                    {expandedDays.includes(dag.dag) && (
                      <div className="p-4 space-y-4 bg-(--dark-crt)/50">
                        {/* Rampenissen Setup */}
                        <div>
                          <h3 className="text-lg font-bold text-(--gold) mb-2">
                            🎭 OPPSETT AV RAMPENISSEN-SCENE:
                          </h3>
                          <p className="mb-2">{dag.rampenissen_rampestrek}</p>
                        </div>

                        {/* Physical Note - What to write */}
                        <div className="border-2 border-(--cold-blue)/50 p-3">
                          <h3 className="text-sm font-bold text-(--cold-blue) mb-2">
                            📝 FYSISK LAPP (Skriv dette på lappen):
                          </h3>
                          <p className="text-(--cold-blue) text-sm italic">
                            &quot;{dag.fysisk_ledetekst}&quot;
                          </p>
                        </div>

                        {/* Digital Quest (shown in app) */}
                        <div className="border-2 border-(--neon-green)/30 p-3">
                          <h3 className="text-sm font-bold text-(--neon-green)/70 mb-2">
                            💻 VISES DIGITALT I APPEN:
                          </h3>
                          <p className="text-(--neon-green)/80 text-sm italic">
                            {dag.beskrivelse}
                          </p>
                        </div>

                        {/* Materials */}
                        <div>
                          <h3 className="text-lg font-bold text-(--gold) mb-2">
                            📦 MATERIALER:
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {dag.materialer_nødvendig.map((materiale, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-(--neon-green)/20 border border-(--neon-green)"
                              >
                                {materiale}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Room & Hint Type */}
                        <div className="flex gap-4">
                          <div>
                            <span className="text-(--gold)">📍 ROM:</span>{" "}
                            {dag.beste_rom}
                          </div>
                          <div>
                            <span className="text-(--gold)">🔍 HINT-TYPE:</span>{" "}
                            {dag.hint_type}
                          </div>
                        </div>

                        {/* Expected Code */}
                        <div className="border-2 border-(--christmas-red) p-3 bg-(--christmas-red)/10">
                          <span className="text-(--christmas-red) font-bold">
                            🔐 RIKTIG KODE:
                          </span>{" "}
                          <span className="text-2xl font-bold">{dag.kode}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Crisis Management Section */}
        <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/10 p-6">
          <h2 className="text-3xl font-bold text-(--christmas-red) mb-4">
            ⚠️ KRISE-HÅNDTERING
          </h2>

          {/* Antenna Crisis */}
          <div className="mb-6 p-4 border-2 border-(--christmas-red)">
            <h3 className="text-xl font-bold mb-2">
              📡 ANTENNE-KRISE (Dag 11-12)
            </h3>
            <p className="mb-3">
              <strong>Når:</strong> Dag 11 morgen (etter Dag 10 fullført)
            </p>
            <p className="mb-3">
              <strong>Beskrivelse:</strong> NORDPOL TV viser &quot;SIGNAL LOST -
              ANTENNA MALFUNCTION&quot;. Barna må bygge en tinfolie-antenne og
              sette den på toppen av TV-en/skjermen.
            </p>
            <p className="mb-3">
              <strong>Løsning:</strong> La barna lage en antenne av tinfoil og
              tape. Når de er ferdige, trykk bekreft nedenfor.
            </p>
            <button
              onClick={handleAntennaCrisisConfirm}
              disabled={antennaConfirmed}
              className={`px-6 py-3 text-xl font-bold border-4 ${
                antennaConfirmed
                  ? "bg-(--gold) border-(--gold) text-black cursor-not-allowed"
                  : "bg-(--neon-green) border-(--neon-green) text-black hover:opacity-80"
              }`}
            >
              {antennaConfirmed ? "✓ ANTENNE FIKSET" : "BEKREFT ANTENNE FIKSET"}
            </button>
          </div>

          {/* Inventory Crisis */}
          <div className="p-4 border-2 border-(--christmas-red)">
            <h3 className="text-xl font-bold mb-2">
              📊 INVENTAR-KRISE (Dag 17-18)
            </h3>
            <p className="mb-3">
              <strong>Når:</strong> Dag 17 morgen (etter Dag 16 fullført)
            </p>
            <p className="mb-3">
              <strong>Beskrivelse:</strong> NISSESTATS viser &quot;CRITICAL
              ERROR - INVENTORY SYSTEM OFFLINE&quot;. Barna må telle og
              organisere lekene sine.
            </p>
            <p className="mb-3">
              <strong>Løsning:</strong> La barna telle leker i en kategori
              (biler, dukker, etc.) og rapportere totalen. Når de er ferdige,
              trykk bekreft.
            </p>
            <button
              onClick={handleInventoryCrisisConfirm}
              disabled={inventoryConfirmed}
              className={`px-6 py-3 text-xl font-bold border-4 ${
                inventoryConfirmed
                  ? "bg-(--gold) border-(--gold) text-black cursor-not-allowed"
                  : "bg-(--neon-green) border-(--neon-green) text-black hover:opacity-80"
              }`}
            >
              {inventoryConfirmed
                ? "✓ INVENTAR FIKSET"
                : "BEKREFT INVENTAR FIKSET"}
            </button>
          </div>
        </div>

        {/* Santa Letters Section */}
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-3xl font-bold text-(--gold) mb-4">
            ✉️ NISSEBREV (Låses opp Dag 14)
          </h2>
          <p className="mb-4">
            Skriv personlige brev fra Julenissen som barna kan lese i
            NISSEBREV-modulen. Brevene lagres i nettleseren.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block mb-2 font-bold">DAG:</label>
              <input
                type="number"
                min="1"
                max="24"
                value={currentLetterDay}
                onChange={(e) => setCurrentLetterDay(parseInt(e.target.value))}
                className="w-full p-2 bg-(--dark-crt) border-2 border-(--gold) text-(--gold) text-xl"
              />
            </div>
            <div>
              <label className="block mb-2 font-bold">BREV-INNHOLD:</label>
              <textarea
                value={letterInput}
                onChange={(e) => setLetterInput(e.target.value)}
                rows={6}
                placeholder="Kjære [barnets navn],\n\nJeg har sett at du...\n\n- Julenissen"
                className="w-full p-3 bg-(--dark-crt) border-2 border-(--gold) text-(--gold) text-lg font-mono"
              />
            </div>
            <button
              onClick={handleAddLetter}
              className="px-6 py-3 bg-(--gold) border-4 border-(--gold) text-black font-bold text-xl hover:opacity-80"
            >
              LAGRE BREV
            </button>
          </div>
        </div>

        {/* Shopping Checklist */}
        <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6">
          <h2 className="text-3xl font-bold text-(--cold-blue) mb-4">
            🛒 HANDLEKURV-LISTE
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">🎨 GENERELT:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>QR-kode til boot passord (dag 1)</li>
                <li>Tinfolie (antenne-krise)</li>
                <li>Tape (flere dager)</li>
                <li>Sjokoladekaker (dag 15)</li>
                <li>Mandel (dag 15)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">🎄 JULEPYNT:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Papir-stjerner (dag 17, 21)</li>
                <li>Julesokker (dag 22)</li>
                <li>Lys/LED (dag 13)</li>
                <li>Gavepapir (dag 14)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Printout Link */}
        <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-6">
          <h2 className="text-3xl font-bold text-(--neon-green) mb-4">
            🖨️ UTSKRIFTER
          </h2>
          <p className="text-xl mb-4">
            Alle fysiske ledetekster for hele desember, klare for utskrift!
          </p>
          <button
            onClick={() => router.push(`/nissemor-guide/printout?key=${key}`)}
            className="px-6 py-3 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80"
          >
            GÅ TIL UTSKRIFTSSIDE
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-8 text-center opacity-70 text-sm">
        <p>NisseKomm v1.0 - Nissemor Control Panel</p>
        <p>Hold denne siden hemmelig fra barna! 🤫</p>
      </div>
    </div>
  );
}

export default function NissemorGuide() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <NissemorGuideContent />
    </Suspense>
  );
}
