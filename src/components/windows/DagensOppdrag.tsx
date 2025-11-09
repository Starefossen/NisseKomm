'use client';

import { RetroWindow } from '../ui/RetroWindow';
import { TerminalText } from '../ui/TerminalText';
import { Icons } from '@/lib/icons';
import { Oppdrag } from '@/types/innhold';

interface DagensOppdragProps {
  mission: Oppdrag;
  onClose: () => void;
  onOpenKodeTerminal: () => void;
}

export function DagensOppdrag({ mission, onClose, onOpenKodeTerminal }: DagensOppdragProps) {
  return (
    <RetroWindow title="DAGENS OPPDRAG" onClose={onClose}>
      <div className="p-6 space-y-6">
        {/* Mission header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Gift size={32} color="gold" />
          <div>
            <div className="text-sm opacity-70">DAG {mission.dag}</div>
            <div className="text-2xl font-bold tracking-wider">{mission.tittel}</div>
          </div>
        </div>

        {/* Warning indicator */}
        <div className="flex items-center gap-3 p-4 border-2 border-(--gold) bg-(--gold)/10">
          <Icons.Warning size={24} color="gold" />
          <span className="text-sm">OPPDRAG AKTIV - FINN KODEN</span>
        </div>

        {/* Mission description */}
        <div className="space-y-4">
          <div className="text-2xl font-bold">OPPDRAGSBESKRIVELSE:</div>
          <div className="p-4 border-2 border-(--neon-green) bg-black/50">
            <TerminalText
              text={mission.beskrivelse}
              speed={30}
              className="text-xl leading-relaxed"
            />
          </div>
        </div>

        {/* Public event if exists */}
        {mission.hendelse && (
          <div className="mt-6 p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Alert size={20} color="blue" />
              <span className="text-sm font-bold text-(--cold-blue)">OFFENTLIG HENDELSE</span>
            </div>
            <div className="text-sm text-(--cold-blue)">{mission.hendelse}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 border-2 border-(--neon-green)/30 text-sm opacity-70">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Help size={16} />
            <span className="font-bold">INSTRUKSJONER:</span>
          </div>
          <div>Når du har funnet koden, klikk på knappen under for å sende inn svaret.</div>
        </div>

        {/* Open KODETERMINAL button */}
        <button
          onClick={onOpenKodeTerminal}
          className="w-full px-6 py-4 bg-(--cold-blue) text-black text-2xl tracking-wider font-bold border-4 border-(--cold-blue) hover:bg-transparent hover:text-(--cold-blue) transition-colors flex items-center justify-center gap-3"
        >
          <Icons.Code size={32} color="blue" />
          <span>SEND INN KODE</span>
        </button>
      </div>
    </RetroWindow>
  );
}
