import { Icon } from "@/lib/icons";
import { getAllOppdrag } from "@/lib/oppdrag";

const allOppdrag = getAllOppdrag();

interface DayPlanningProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  completedDays: Set<number>;
}

export function DayPlanning({
  selectedDay,
  onSelectDay,
  completedDays,
}: DayPlanningProps) {
  const selectedQuest = allOppdrag.find((q) => q.dag === selectedDay);

  const showKeyboardShortcuts = () => {
    alert(
      "⌨️ TASTATURSNARVEIER:\n\n" +
        "← / h : Forrige dag\n" +
        "→ / l : Neste dag\n" +
        "Home / g : Första dag\n" +
        "End / G : Siste dag\n" +
        "t : Gå til dagens dato\n" +
        "? : Vis denna hjelpen",
    );
  };

  return (
    <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-(--gold) flex items-center gap-2">
          <Icon name="calendar" size={32} />
          DAGENS OPPDRAG (Dag {selectedDay})
        </h2>
        <button
          onClick={showKeyboardShortcuts}
          className="text-sm px-4 py-2 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20 transition-colors"
          title="Vis tastatursnarveier"
        >
          ⌨️ Snarveier (?)
        </button>
      </div>

      {selectedQuest ? (
        <div className="space-y-6">
          {/* Full Width: Setup Instructions */}
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4">
            <h3 className="text-xl font-bold text-(--cold-blue) mb-3">
              🔧 OPPSETT ({selectedQuest.oppsett_tid || "ukjent"})
            </h3>
            <div className="text-sm space-y-2">
              <div>
                <strong className="text-(--cold-blue)">📍 Plassering:</strong>
                <br />
                {selectedQuest.beste_rom || "Inte spesifisert"}
              </div>
              <div>
                <strong className="text-(--cold-blue)">
                  📋 Rampenissen sin rampestrek:
                </strong>
                <br />
                {selectedQuest.rampenissen_rampestrek ||
                  "Ingen instruksjoner tilgjengelig"}
              </div>
              {selectedQuest.materialer_nødvendig &&
                selectedQuest.materialer_nødvendig.length > 0 && (
                  <div>
                    <strong className="text-(--cold-blue)">
                      🛠️ Materialer:
                    </strong>
                    <ul className="list-disc list-inside mt-1">
                      {selectedQuest.materialer_nødvendig.map(
                        (material, index) => (
                          <li key={index}>{material}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>

          {/* Full Width: Nissemail Text */}
          <div className="border-2 border-(--neon-green)/50 p-4">
            <h3 className="text-xl font-bold mb-3">📖 NISSEMAIL TEKST</h3>
            <p className="text-sm">{selectedQuest.nissemail_tekst}</p>
          </div>

          {/* Full Width: Julius Dagbok */}
          <div className="border-2 border-(--gold)/50 p-4">
            <h3 className="text-xl font-bold mb-3">📔 JULIUS DAGBOK</h3>
            <p className="text-sm">{selectedQuest.dagbokinnlegg}</p>
          </div>

          {/* Grid: Solution Code and Physical Hint */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
              <h3 className="text-xl font-bold text-(--gold) mb-3">
                🔑 LØSNING
              </h3>
              <div className="bg-black/30 p-4 border border-(--gold)/30 font-mono text-2xl text-center">
                {selectedQuest.kode}
              </div>
            </div>

            {selectedQuest.fysisk_hint && (
              <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/10 p-4">
                <h3 className="text-xl font-bold text-(--christmas-red) mb-3">
                  💡 FYSISK HINT
                </h3>
                <div className="text-sm">
                  <div className="bg-black/20 p-2 border border-(--christmas-red)/30">
                    <strong>Ledetekst:</strong> {selectedQuest.fysisk_hint}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional sections */}
          {selectedQuest.bonusoppdrag && (
            <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
              <h3 className="text-xl font-bold text-(--gold) mb-3">
                🏅 BONUSOPPDRAG
              </h3>
              <p className="text-sm">
                Denna dagen har et bonusoppdrag som krever foreldrenes hjelp för
                å validere.
              </p>
            </div>
          )}

          {selectedQuest.hendelse && (
            <div className="border-2 border-(--gold)/50 p-4">
              <h3 className="text-xl font-bold mb-3">🎉 HENDELSE</h3>
              <p className="text-sm">{selectedQuest.hendelse}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-2xl">Velg en dag för å se detaljer</p>
      )}

      {/* Day Selector */}
      <div className="mt-6 border-t-2 border-(--gold)/30 pt-4">
        <h3 className="text-xl font-bold text-(--gold) mb-3 text-center">
          Velg dag å vise:
        </h3>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {allOppdrag.map((quest) => {
            const isCompleted = completedDays.has(quest.dag);
            const isSelected = quest.dag === selectedDay;

            return (
              <button
                key={quest.dag}
                onClick={() => onSelectDay(quest.dag)}
                className={`
                  aspect-square border-2 font-bold text-lg transition-all
                  ${isSelected ? "border-(--gold) bg-(--gold)/20 text-(--gold)" : "border-(--neon-green)/30"}
                  ${isCompleted ? "bg-(--neon-green)/10 text-(--neon-green)" : "text-(--neon-green)/70"}
                  hover:border-(--gold) hover:bg-(--gold)/10
                `}
                title={`Dag ${quest.dag}: ${quest.tittel}`}
              >
                {quest.dag}
                {isCompleted && <div className="text-xs">✓</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
