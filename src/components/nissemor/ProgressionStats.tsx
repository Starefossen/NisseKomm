"use client";

interface ProgressionStatsProps {
  progression: {
    mainQuests: { completed: number; total: number };
    bonusOppdrag: { completed: number; available: number };
    modules: { unlocked: number; total: number };
    badges: { earned: number; total: number };
  };
  onRefresh: () => void;
  lastUpdated: Date;
}

export function ProgressionStats({
  progression,
  onRefresh,
  lastUpdated,
}: ProgressionStatsProps) {
  return (
    <div className="max-w-7xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-(--neon-green)">📊 FREMGANG</h2>
        <div className="text-right">
          <button
            onClick={onRefresh}
            className="mb-1 px-4 py-2 border-2 border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20 transition-colors font-bold text-sm"
            title="Oppdater fremgang fra barnas spill"
          >
            🔄 OPPDATER
          </button>
          <div className="text-xs opacity-60">
            Sist oppdatert: {lastUpdated.toLocaleTimeString("nb-NO")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Main Quests */}
        <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-(--neon-green) mb-2">
              {progression.mainQuests.completed}/{progression.mainQuests.total}
            </div>
            <div className="text-lg">Hovedoppdrag</div>
          </div>
        </div>

        {/* Bonus Quests */}
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-(--gold) mb-2">
              {progression.bonusOppdrag.completed}/
              {progression.bonusOppdrag.available}
            </div>
            <div className="text-lg">Bonusoppdrag</div>
          </div>
        </div>

        {/* Modules */}
        <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-(--cold-blue) mb-2">
              {progression.modules.unlocked}/{progression.modules.total}
            </div>
            <div className="text-lg">Moduler Låst Opp</div>
          </div>
        </div>

        {/* Badges */}
        <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/10 p-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-(--christmas-red) mb-2">
              {progression.badges.earned}/{progression.badges.total}
            </div>
            <div className="text-lg">Badges Tildelt</div>
          </div>
        </div>
      </div>
    </div>
  );
}
