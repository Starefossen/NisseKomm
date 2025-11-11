"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllOppdrag } from "@/lib/oppdrag";
import { StorageManager } from "@/lib/storage";
import { getSideQuestDefinition } from "@/lib/sideoppdrag";

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
    const def = getSideQuestDefinition("antenna");
    StorageManager.resolveCrisis("antenna");
    StorageManager.addSideQuestBadge(
      def.badgeDay,
      def.badgeIcon,
      def.badgeName,
    );
    setAntennaConfirmed(true);
  };

  const handleInventoryCrisisConfirm = () => {
    const def = getSideQuestDefinition("inventory");
    StorageManager.resolveCrisis("inventory");
    StorageManager.addSideQuestBadge(
      def.badgeDay,
      def.badgeIcon,
      def.badgeName,
    );
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

      {/* Progression Overview */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-3xl font-bold text-(--gold) mb-4 text-center">
            📅 FREMDRIFTS-OVERSIKT
          </h2>

          {/* Module Unlocks */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-(--cold-blue) mb-3">
              🔓 Modul-Opplåsinger
            </h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3 p-2 bg-black/30 border-2 border-(--neon-green)/30">
                <span className="text-xl font-bold text-(--gold)">Dag 7:</span>
                <span className="text-lg">
                  🎵 NISSEMUSIKK låses opp (julesanger)
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-black/30 border-2 border-(--neon-green)/30">
                <span className="text-xl font-bold text-(--gold)">Dag 10:</span>
                <span className="text-lg">
                  📺 SNØFALL TV låses opp (video-dagbok)
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-black/30 border-2 border-(--neon-green)/30">
                <span className="text-xl font-bold text-(--gold)">Dag 14:</span>
                <span className="text-lg">
                  ✉️ BREVFUGLER låses opp (brev fra Julius)
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-black/30 border-2 border-(--neon-green)/30">
                <span className="text-xl font-bold text-(--gold)">Dag 16:</span>
                <span className="text-lg">
                  📊 NISSESTATS låses opp (statistikk fra verkstedet)
                </span>
              </div>
            </div>
          </div>

          {/* Side-Quests and Badges */}
          <div>
            <h3 className="text-2xl font-bold text-(--cold-blue) mb-3">
              🏅 Sideoppdrag og Merker
            </h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3 p-2 bg-(--gold)/20 border-2 border-(--gold)/50">
                <span className="text-xl font-bold text-(--gold)">Dag 11:</span>
                <span className="text-lg">
                  ⚡ ANTENNE-KRISE → Merke: &quot;ANTENNE-INGENIØR&quot;
                  (forelder-validert)
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-(--gold)/20 border-2 border-(--gold)/50">
                <span className="text-xl font-bold text-(--gold)">Dag 16:</span>
                <span className="text-lg">
                  💰 INVENTAR-KRISE → Merke: &quot;INVENTAR-EKSPERT&quot;
                  (forelder-validert)
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm italic opacity-80">
              💡 Sideoppdrag-e-poster vises først ETTER at hovedoppdraget er
              fullført. Merkene vises som trofeer nederst på startskjermen.
            </p>
          </div>
        </div>
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

                        {/* Advanced Multi-Room Setup for specific days */}
                        {[9, 10, 11, 19, 20].includes(dag.dag) && (
                          <details className="border-4 border-(--gold) bg-(--gold)/10 p-4">
                            <summary className="text-xl font-bold text-(--gold) cursor-pointer mb-3">
                              🗺️ AVANSERT OPPSETT (Flerromsoppdrag) - Klikk for
                              detaljer
                            </summary>
                            <div className="space-y-3 text-sm">
                              {/* Day 9: Snowflake Hunt */}
                              {dag.dag === 9 && (
                                <>
                                  <p className="font-bold text-lg mb-2">
                                    10 Snøfnugg - Spredt over 3 rom
                                  </p>
                                  <div className="space-y-2">
                                    <div className="pl-4 border-l-4 border-(--cold-blue)">
                                      <p className="font-bold text-(--cold-blue)">
                                        🚽 BAD (3 snøfnugg, 2 med blå bakside):
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Snøfnugg #1: På speilet (blå bakside:
                                          "3")
                                        </li>
                                        <li>
                                          Snøfnugg #2: Bak dusj-gardin (vanlig)
                                        </li>
                                        <li>
                                          Snøfnugg #3: På toalettet (blå
                                          bakside: "x")
                                        </li>
                                      </ul>
                                    </div>
                                    <div className="pl-4 border-l-4 border-(--cold-blue)">
                                      <p className="font-bold text-(--cold-blue)">
                                        🛋️ STUE (4 snøfnugg, 2 med blå bakside):
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Snøfnugg #4: På TV (blå bakside: "2")
                                        </li>
                                        <li>
                                          Snøfnugg #5: Under pute (vanlig)
                                        </li>
                                        <li>
                                          Snøfnugg #6: Bak sofa (blå bakside:
                                          "=")
                                        </li>
                                        <li>Snøfnugg #7: På vindu (vanlig)</li>
                                      </ul>
                                    </div>
                                    <div className="pl-4 border-l-4 border-(--cold-blue)">
                                      <p className="font-bold text-(--cold-blue)">
                                        🍽️ KJØKKEN (3 snøfnugg, 2 med blå
                                        bakside):
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Snøfnugg #8: I kjøleskap (blå bakside:
                                          "2")
                                        </li>
                                        <li>
                                          Snøfnugg #9: På kaffemaskin (vanlig)
                                        </li>
                                        <li>
                                          Snøfnugg #10: Under skål (blå bakside:
                                          "6")
                                        </li>
                                      </ul>
                                    </div>
                                    <p className="italic text-(--gold) mt-3">
                                      💡 Barna må snu alle snøfnuggene for å
                                      finne de 6 med blå bakside. Tallene blir:
                                      3 x 2 = 2 6 → Kode: 326
                                    </p>
                                  </div>
                                </>
                              )}

                              {/* Day 10: Letter Collection */}
                              {dag.dag === 10 && (
                                <>
                                  <p className="font-bold text-lg mb-2">
                                    5 Grønne Gjenstander med Bokstaver
                                  </p>
                                  <div className="space-y-2">
                                    <div className="pl-4 border-l-4 border-(--neon-green)">
                                      <p className="font-bold text-(--neon-green)">
                                        📍 Plassering (valgfritt hvilke rom):
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Grønn gjenstand #1 (G): Under en
                                          pute/på sofa
                                        </li>
                                        <li>
                                          Grønn gjenstand #2 (R): På
                                          kjøkkenbenk/i kjøleskap
                                        </li>
                                        <li>
                                          Grønn gjenstand #3 (Ø): Bak et
                                          bilde/på hylle
                                        </li>
                                        <li>
                                          Grønn gjenstand #4 (N): I et
                                          skap/skuff
                                        </li>
                                        <li>
                                          Grønn gjenstand #5 (N): Ved vindu/på
                                          dør
                                        </li>
                                      </ul>
                                    </div>
                                    <p className="italic text-(--gold) mt-3">
                                      💡 Bruk små lapper festet til grønne
                                      gjenstander dere allerede har (eple, grønn
                                      kopp, etc.). Eller print ut grønne
                                      firkanter. Bokstavene G-R-Ø-N-N = GRØNN
                                    </p>
                                  </div>
                                </>
                              )}

                              {/* Day 11: Three Clocks */}
                              {dag.dag === 11 && (
                                <>
                                  <p className="font-bold text-lg mb-2">
                                    3 Analoge Klokker - Forskjellige Rom
                                  </p>
                                  <div className="space-y-2">
                                    <div className="pl-4 border-l-4 border-(--neon-green)">
                                      <p className="font-bold text-(--neon-green)">
                                        ⏰ Plassering:
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Klokke #1 (3:00): På kjøkkenbenk eller
                                          bord
                                        </li>
                                        <li>
                                          Klokke #2 (5:00): På nattbord i
                                          soverom
                                        </li>
                                        <li>
                                          Klokke #3 (4:00): På hylle i stue/bad
                                        </li>
                                      </ul>
                                    </div>
                                    <p className="italic text-(--gold) mt-3">
                                      💡 Bruk eksisterende veggklokker eller lag
                                      klokker av papptallerkener med visere.
                                      Still dem til 3:00, 5:00 og 4:00. Summen
                                      blir 3+5+4=12
                                    </p>
                                  </div>
                                </>
                              )}

                              {/* Day 19: Checkpoint Course */}
                              {dag.dag === 19 && (
                                <>
                                  <p className="font-bold text-lg mb-2">
                                    4-Roms Checkpoint-Løype med Miniutfordringer
                                  </p>
                                  <div className="space-y-2">
                                    <div className="pl-4 border-l-4 border-(--gold)">
                                      <p className="font-bold text-(--gold)">
                                        🏁 Checkpoint 1: SOVEROM
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Utfordring: Tell reinsdyrbeina (bruk
                                          små leker eller bilder) → Svar: 4
                                        </li>
                                        <li>
                                          Bokstav: <strong>R</strong>
                                        </li>
                                        <li>
                                          Lapp: "Tell reinsdyrbeina. Husk
                                          svaret! Bokstav: R"
                                        </li>
                                      </ul>
                                    </div>
                                    <div className="pl-4 border-l-4 border-(--gold)">
                                      <p className="font-bold text-(--gold)">
                                        🏁 Checkpoint 2: KJØKKEN
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Utfordring: Tell røde gjenstander →
                                          Svar: 4
                                        </li>
                                        <li>
                                          Bokstaver: <strong>E, I</strong>
                                        </li>
                                        <li>
                                          Lapp: "Tell røde ting. Finn
                                          bokstavene: E, I"
                                        </li>
                                      </ul>
                                    </div>
                                    <div className="pl-4 border-l-4 border-(--gold)">
                                      <p className="font-bold text-(--gold)">
                                        🏁 Checkpoint 3: BAD
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Utfordring: Gåte "Hvit og kald, faller
                                          fra skyene" → Svar: SNØ
                                        </li>
                                        <li>
                                          Bokstaver: <strong>N, S</strong>
                                        </li>
                                        <li>
                                          Lapp: "Hvit og kald, faller fra
                                          skyene? Bokstaver: N, S"
                                        </li>
                                      </ul>
                                    </div>
                                    <div className="pl-4 border-l-4 border-(--gold)">
                                      <p className="font-bold text-(--gold)">
                                        🏁 Checkpoint 4: STUE
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Utfordring: Finn den siste bokstaven
                                        </li>
                                        <li>
                                          Bokstaver: <strong>D, Y</strong>
                                        </li>
                                        <li>
                                          Lapp: "Siste stopp! Bokstaver: D, Y"
                                        </li>
                                      </ul>
                                    </div>
                                    <p className="italic text-(--gold) mt-3">
                                      💡 Barna må besøke alle 4 rom i
                                      rekkefølge. R-E-I-N-S-D-Y-R → Svar på
                                      siste gåte er 4 (reinsdyrbein). Kode:
                                      REIN4
                                    </p>
                                  </div>
                                </>
                              )}

                              {/* Day 20: Obstacle Course */}
                              {dag.dag === 20 && (
                                <>
                                  <p className="font-bold text-lg mb-2">
                                    5-Checkpoint Hinderbane med Skjulte
                                    Bokstaver
                                  </p>
                                  <div className="space-y-2">
                                    <div className="pl-4 border-l-4 border-(--cold-blue)">
                                      <p className="font-bold text-(--cold-blue)">
                                        📍 Checkpoint-plassering:
                                      </p>
                                      <ul className="list-disc ml-6 mt-1">
                                        <li>
                                          Checkpoint 1: UNDER kjøkkenbord
                                          (Bokstav: S)
                                        </li>
                                        <li>
                                          Checkpoint 2: BAK soveromsdør
                                          (Bokstav: L)
                                        </li>
                                        <li>
                                          Checkpoint 3: I bokhylle (Bokstav: E)
                                        </li>
                                        <li>
                                          Checkpoint 4: UNDER putepute på sofa
                                          (Bokstav: D)
                                        </li>
                                        <li>
                                          Checkpoint 5: VED vindu i stue
                                          (Bokstav: E)
                                        </li>
                                      </ul>
                                    </div>
                                    <p className="italic text-(--gold) mt-3">
                                      💡 Print ut checkpoint-kort (se
                                      utskrift-siden) og fest dem på stedene.
                                      Barna må fysisk bevege seg til hvert sted.
                                      S-L-E-D-E = SLEDE
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </details>
                        )}

                        {/* Side-quest display */}
                        {dag.sideoppdrag && (
                          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">⚠️</span>
                              <h3 className="text-xl font-bold text-(--gold)">
                                SIDEOPPDRAG: {dag.sideoppdrag.tittel}
                              </h3>
                            </div>
                            <p className="mb-2 text-(--gold)/90">
                              {dag.sideoppdrag.beskrivelse}
                            </p>
                            <div className="flex items-center gap-2 mt-3 p-2 bg-black/30 border-2 border-(--gold)/30">
                              <span className="text-sm font-bold">
                                VALIDERING:
                              </span>
                              <span className="text-sm">
                                {dag.sideoppdrag.validering === "forelder"
                                  ? "👤 Bekreft når barna har fullført (se Krise-Håndtering seksjon)"
                                  : "💻 Send kode i terminal"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 p-2 bg-(--gold)/20 border-2 border-(--gold)">
                              <span className="text-sm font-bold">
                                BELØNNING:
                              </span>
                              <span className="text-sm">
                                🏅 {dag.sideoppdrag.badge_navn}
                              </span>
                            </div>
                          </div>
                        )}
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
              <strong>Beskrivelse:</strong> SNØFALL TV viser &quot;SIGNAL LOST -
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
            ✉️ BREVFUGLER (Låses opp Dag 14)
          </h2>
          <p className="mb-4">
            Skriv personlige brev fra Julius som barna kan lese i
            BREVFUGLER-modulen. Brevene lagres i nettleseren.
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
                placeholder="Kjære [barnets navn],\n\nJeg har sett at du...\n\n- Julius"
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
