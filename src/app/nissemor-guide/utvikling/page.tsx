"use client";

import { Suspense, useState, useEffect } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import { StorageManager } from "@/lib/storage";
import { BadgeManager } from "@/lib/badge-system";

const allOppdrag = GameEngine.getAllQuests();

function UtviklingContent() {
  const [, forceUpdate] = useState({});

  // Listen for storage changes to auto-update development page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      // Refresh on any nissekomm storage change
      if (e.key?.startsWith("nissekomm-")) {
        forceUpdate({});
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleAddLetter = () => {
    const dayInput = prompt("Dag (1-24):");
    if (!dayInput) return;

    const day = parseInt(dayInput);
    if (day < 1 || day > 24) {
      alert("Ugyldig dag!");
      return;
    }

    const content = prompt("Skriv innholdet i brevet:");
    if (!content) return;

    try {
      StorageManager.addSantaLetter(day, content);
      alert(`✓ Brev for dag ${day} lagret!`);
    } catch (error) {
      console.error("Failed to save letter:", error);
      alert("Kunne ikke lagre brevet.");
    }
  };

  const refreshPage = () => {
    forceUpdate({});
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="utvikling" />

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider text-(--christmas-red)">
          🔧 UTVIKLING & TESTING 🔧
        </h1>
        <p className="text-center text-xl opacity-70">
          Administrasjons- og testverktøy (kun for utviklere)
        </p>
      </div>

      {/* Warning Banner */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/20 p-6">
          <h2 className="text-3xl font-bold text-(--christmas-red) mb-2 text-center">
            ⚠️ ADVARSEL ⚠️
          </h2>
          <p className="text-center text-xl">
            Disse verktøyene er kun for testing og utvikling.
            <br />
            Bruk med forsiktighet! Endringer kan ikke angres.
          </p>
        </div>
      </div>

      {/* Management Actions */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-6">
          <h2 className="text-3xl font-bold text-(--neon-green) mb-4 text-center">
            🎮 ADMINISTRASJON
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unlock All Modules */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Lås opp ALLE moduler? Dette vil gi tilgang til NISSEKRYPTO, NISSEMUSIKK, SNØFALL_TV, BREVFUGLER, og NISSESTATS.",
                  )
                ) {
                  StorageManager.unlockModule("NISSEKRYPTO");
                  StorageManager.unlockModule("NISSEMUSIKK");
                  StorageManager.unlockModule("SNØFALL_TV");
                  StorageManager.unlockModule("BREVFUGLER");
                  StorageManager.unlockModule("NISSESTATS");
                  StorageManager.unlockModule("EVENTYR_OVERSIKT");
                  alert("✓ Alle moduler er nå låst opp!");
                  refreshPage();
                }
              }}
              className="p-4 bg-(--gold) hover:bg-(--gold)/80 text-black font-bold text-lg border-2 border-black transition-colors"
            >
              🔓 LÅS OPP ALLE MODULER
            </button>

            {/* Complete All Quests */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Marker ALLE oppdrag som fullført? Dette vil sette inn alle koder i systemet.",
                  )
                ) {
                  allOppdrag.forEach((quest) => {
                    GameEngine.submitCode(quest.kode, quest.kode, quest.dag);
                  });
                  alert("✓ Alle oppdrag er nå fullført!");
                  refreshPage();
                }
              }}
              className="p-4 bg-(--neon-green) hover:bg-(--neon-green)/80 text-black font-bold text-lg border-2 border-black transition-colors"
            >
              ✓ FULLFØR ALLE OPPDRAG
            </button>

            {/* Award All Badges */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Tildel ALLE badges? Dette vil gi både Antenne-ingeniør og Inventar-ekspert badges.",
                  )
                ) {
                  BadgeManager.checkAndAwardBadge("antenne-ingenior", true);
                  BadgeManager.checkAndAwardBadge("inventar-ekspert", true);
                  alert("✓ Alle badges er nå tildelt!");
                  refreshPage();
                }
              }}
              className="p-4 bg-(--cold-blue) hover:bg-(--cold-blue)/80 text-black font-bold text-lg border-2 border-black transition-colors"
            >
              🏅 TILDEL ALLE BADGES
            </button>

            {/* Add All Symbols */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Samle ALLE symboler? Dette vil legge til alle 9 symbolene i NisseKrypto-systemet.",
                  )
                ) {
                  const symbolQuests = allOppdrag.filter((q) => q.symbol_clue);
                  symbolQuests.forEach((quest) => {
                    if (quest.symbol_clue) {
                      StorageManager.addCollectedSymbol(quest.symbol_clue);
                    }
                  });
                  alert(
                    `✓ Alle ${symbolQuests.length} symboler er samlet!\n\nDu kan nå teste dekrypteringsutfordringene i NISSEKRYPTO.`,
                  );
                  refreshPage();
                }
              }}
              className="p-4 bg-purple-600 hover:bg-purple-600/80 text-white font-bold text-lg border-2 border-black transition-colors"
            >
              🎁 SAMLE ALLE SYMBOLER
            </button>

            {/* Clear All Symbols */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Fjern ALLE symboler? Dette vil slette alle innsamlede symboler.",
                  )
                ) {
                  StorageManager.clearCollectedSymbols();
                  alert("✓ Alle symboler fjernet!");
                  refreshPage();
                }
              }}
              className="p-4 bg-purple-900 hover:bg-purple-900/80 text-white font-bold text-lg border-2 border-black transition-colors"
            >
              🗑️ FJERN ALLE SYMBOLER
            </button>

            {/* Reset Everything */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "TILBAKESTILL ALT? Dette vil slette ALL fremgang, koder, moduler, badges, og brev. Kan ikke angres!",
                  )
                ) {
                  if (
                    confirm(
                      "Er du HELT SIKKER? All data vil bli permanent slettet!",
                    )
                  ) {
                    StorageManager.clearAll();
                    alert("✓ Alt er tilbakestilt!");
                    refreshPage();
                  }
                }
              }}
              className="p-4 bg-(--christmas-red) hover:bg-(--christmas-red)/80 text-white font-bold text-lg border-2 border-black transition-colors"
            >
              🗑️ TILBAKESTILL ALT
            </button>

            {/* View Game State */}
            <button
              onClick={() => {
                const state = GameEngine.loadGameState();
                const summary = GameEngine.getProgressionSummary();
                console.log("Game State:", state);
                console.log("Progression:", summary);
                alert(
                  `📊 TILSTAND:\n\n` +
                    `Hovedoppdrag: ${summary.mainQuests.completed}/${summary.mainQuests.total}\n` +
                    `Bonusoppdrag: ${summary.bonusOppdrag.completed}/${summary.bonusOppdrag.available}\n` +
                    `Moduler: ${summary.modules.unlocked}/${summary.modules.total}\n` +
                    `Badges: ${summary.badges.earned}/${summary.badges.total}\n\n` +
                    `Se konsollen for detaljer.`,
                );
              }}
              className="p-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg border-2 border-black transition-colors"
            >
              📊 VIS SPILLTILSTAND
            </button>

            {/* Export State */}
            <button
              onClick={() => {
                const exported = GameEngine.exportGameState();
                navigator.clipboard.writeText(exported);
                alert(
                  "✓ Spilltilstand kopiert til utklippstavlen!\n\nDu kan lime inn denne teksten senere for å gjenopprette fremgangen.",
                );
              }}
              className="p-4 bg-purple-700 hover:bg-purple-600 text-white font-bold text-lg border-2 border-black transition-colors"
            >
              💾 EKSPORTER TILSTAND
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6">
          <h2 className="text-3xl font-bold text-(--cold-blue) mb-4 text-center">
            ⚡ RASKE HANDLINGER
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Complete One Day */}
            <button
              onClick={() => {
                const day = prompt("Hvilken dag vil du fullføre? (1-24)");
                if (day) {
                  const dayNum = parseInt(day);
                  if (dayNum >= 1 && dayNum <= 24) {
                    const quest = allOppdrag.find((q) => q.dag === dayNum);
                    if (quest) {
                      GameEngine.submitCode(quest.kode, quest.kode, dayNum);
                      alert(`✓ Dag ${dayNum} er fullført!`);
                      refreshPage();
                    }
                  } else {
                    alert("Ugyldig dag! Må være mellom 1 og 24.");
                  }
                }
              }}
              className="p-2 bg-(--neon-green)/30 hover:bg-(--neon-green)/50 text-(--neon-green) text-sm font-bold border border-(--neon-green)"
            >
              ✓ Fullfør én dag
            </button>

            {/* Unlock One Module */}
            <button
              onClick={() => {
                const modules = [
                  "NISSEKRYPTO",
                  "NISSEMUSIKK",
                  "SNØFALL_TV",
                  "BREVFUGLER",
                  "NISSESTATS",
                  "EVENTYR_OVERSIKT",
                ];
                const choice = prompt(
                  `Hvilken modul vil du låse opp?\n\n1. NISSEKRYPTO\n2. NISSEMUSIKK\n3. SNØFALL_TV\n4. BREVFUGLER\n5. NISSESTATS\n6. EVENTYR_OVERSIKT\n\nSkriv nummeret (1-6):`,
                );
                if (choice) {
                  const index = parseInt(choice) - 1;
                  if (index >= 0 && index < modules.length) {
                    StorageManager.unlockModule(modules[index]);
                    alert(`✓ ${modules[index]} er nå låst opp!`);
                    refreshPage();
                  }
                }
              }}
              className="p-2 bg-(--cold-blue)/30 hover:bg-(--cold-blue)/50 text-(--cold-blue) text-sm font-bold border border-(--cold-blue)"
            >
              🔓 Lås opp én modul
            </button>

            {/* Award One Badge */}
            <button
              onClick={() => {
                const badgeIds = ["antenne-ingenior", "inventar-ekspert"];
                const choice = prompt(
                  `Hvilken badge vil du tildele?\n\n1. Antenne-ingeniør\n2. Inventar-ekspert\n\nSkriv nummeret (1-2):`,
                );
                if (choice) {
                  const index = parseInt(choice) - 1;
                  if (index >= 0 && index < badgeIds.length) {
                    BadgeManager.checkAndAwardBadge(badgeIds[index], true);
                    alert(
                      `✓ ${index === 0 ? "Antenne-ingeniør" : "Inventar-ekspert"} badge tildelt!`,
                    );
                    refreshPage();
                  }
                }
              }}
              className="p-2 bg-(--gold)/30 hover:bg-(--gold)/50 text-(--gold) text-sm font-bold border border-(--gold)"
            >
              🏅 Tildel én badge
            </button>

            {/* Complete X Days */}
            <button
              onClick={() => {
                const days = prompt("Hvor mange dager vil du fullføre? (1-24)");
                if (days) {
                  const count = parseInt(days);
                  if (count >= 1 && count <= 24) {
                    for (let i = 0; i < count; i++) {
                      const quest = allOppdrag[i];
                      GameEngine.submitCode(quest.kode, quest.kode, quest.dag);
                    }
                    alert(`✓ De første ${count} dagene er fullført!`);
                    refreshPage();
                  }
                }
              }}
              className="p-2 bg-purple-700/30 hover:bg-purple-700/50 text-purple-400 text-sm font-bold border border-purple-400"
            >
              ⚡ Fullfør X dager
            </button>

            {/* Solve Challenge */}
            <button
              onClick={() => {
                const challenges = allOppdrag
                  .filter((q) => q.decryption_challenge)
                  .map((q) => ({
                    id: q.decryption_challenge!.challengeId,
                    day: q.dag,
                    title: q.tittel,
                  }));

                const choice = prompt(
                  `Hvilken utfordring vil du løse?\n\n${challenges.map((c, i) => `${i + 1}. Dag ${c.day}: ${c.title}`).join("\n")}\n\nSkriv nummeret (1-${challenges.length}):`,
                );

                if (choice) {
                  const index = parseInt(choice) - 1;
                  if (index >= 0 && index < challenges.length) {
                    const challenge = challenges[index];
                    StorageManager.addSolvedDecryption(challenge.id);
                    const quest = allOppdrag.find(
                      (q) => q.dag === challenge.day,
                    );
                    if (quest?.decryption_challenge?.unlocksFiles) {
                      quest.decryption_challenge.unlocksFiles.forEach(
                        (fileId) => {
                          StorageManager.addUnlockedFile(fileId);
                        },
                      );
                    }
                    alert(`✓ ${challenge.title} er nå løst!`);
                    refreshPage();
                  }
                }
              }}
              className="p-2 bg-purple-500/30 hover:bg-purple-500/50 text-purple-300 text-sm font-bold border border-purple-300"
            >
              🔑 Løs én utfordring
            </button>

            {/* Symbol/Challenge Status */}
            <button
              onClick={() => {
                const symbols = GameEngine.getCollectedSymbols();
                const challenges = allOppdrag
                  .filter((q) => q.decryption_challenge)
                  .map((q) => ({
                    id: q.decryption_challenge!.challengeId,
                    day: q.dag,
                    title: q.tittel,
                    solved: StorageManager.isDecryptionSolved(
                      q.decryption_challenge!.challengeId,
                    ),
                  }));

                const symbolList = symbols
                  .map((s) => `  • ${s.description} (${s.symbolId})`)
                  .join("\n");
                const challengeList = challenges
                  .map(
                    (c) =>
                      `  • Dag ${c.day}: ${c.title} - ${c.solved ? "✓ LØST" : "❌ IKKE LØST"}`,
                  )
                  .join("\n");

                alert(
                  `📊 NISSEKRYPTO STATUS\n\n` +
                    `🎁 SYMBOLER (${symbols.length}/9):\n${symbolList || "  (ingen samlet)"}\n\n` +
                    `🔑 UTFORDRINGER (${challenges.filter((c) => c.solved).length}/${challenges.length}):\n${challengeList}`,
                );
              }}
              className="p-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-400 text-sm font-bold border border-cyan-400"
            >
              📊 Symbol-status
            </button>

            {/* Add Letter */}
            <button
              onClick={handleAddLetter}
              className="p-2 bg-(--gold)/30 hover:bg-(--gold)/50 text-(--gold) text-sm font-bold border border-(--gold)"
            >
              ✉️ Legg til brev
            </button>

            {/* Solve All Challenges */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Løs alle dekrypteringsutfordringer? Dette vil markere alle som løst og låse opp alle filer.",
                  )
                ) {
                  const challenges = allOppdrag.filter(
                    (q) => q.decryption_challenge,
                  );
                  challenges.forEach((quest) => {
                    if (quest.decryption_challenge) {
                      StorageManager.addSolvedDecryption(
                        quest.decryption_challenge.challengeId,
                      );
                      if (quest.decryption_challenge.unlocksFiles) {
                        quest.decryption_challenge.unlocksFiles.forEach(
                          (fileId) => {
                            StorageManager.addUnlockedFile(fileId);
                          },
                        );
                      }
                    }
                  });
                  alert(`✓ Alle ${challenges.length} utfordringer er nå løst!`);
                  refreshPage();
                }
              }}
              className="p-2 bg-cyan-800/30 hover:bg-cyan-800/50 text-cyan-300 text-sm font-bold border border-cyan-300"
            >
              🔓 Løs alle utfordringer
            </button>
          </div>
        </div>
      </div>

      {/* Import State */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="border-4 border-purple-500 bg-purple-500/10 p-6">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center">
            📥 IMPORTER TILSTAND
          </h2>
          <p className="text-sm opacity-70 mb-4 text-center">
            Lim inn eksportert tilstand her:
          </p>
          <textarea
            className="w-full h-24 p-2 bg-black text-(--neon-green) border-2 border-(--neon-green) font-mono text-sm"
            placeholder="Lim inn JSON-data her..."
            id="importStateTextarea"
          />
          <div className="text-center mt-4">
            <button
              onClick={async () => {
                const textarea = document.getElementById(
                  "importStateTextarea",
                ) as HTMLTextAreaElement;
                const data = textarea?.value.trim();
                if (!data) {
                  alert("Ingen data å importere!");
                  return;
                }
                try {
                  await GameEngine.importGameState(data);
                  alert("✓ Tilstand importert!");
                  refreshPage();
                } catch (error) {
                  alert(
                    `❌ Kunne ikke importere: ${error instanceof Error ? error.message : "Ukjent feil"}`,
                  );
                }
              }}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xl border-2 border-black"
            >
              IMPORTER
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Utviklings- og Testpanel</p>
        <p>Kun for utviklere! Ikke vis til barna. 🤫</p>
      </div>
    </div>
  );
}

export default function UtviklingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <UtviklingContent />
      </GuideAuth>
    </Suspense>
  );
}
