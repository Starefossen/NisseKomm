'use client';

import { useState } from 'react';
import { SidebarWidget } from '../ui/SidebarWidget';
import { Icons } from '@/lib/icons';
import { Varsel } from '@/types/innhold';

interface VarselKonsollProps {
  alerts: Varsel[];
}

export function VarselKonsoll({ alerts }: VarselKonsollProps) {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const handleAlertClick = (id: string) => {
    setSelectedAlert(selectedAlert === id ? null : id);
  };

  const getAlertColor = (type: Varsel['type']) => {
    switch (type) {
      case 'kritisk': return 'red';
      case 'advarsel': return 'gold';
      default: return 'blue';
    }
  };

  return (
    <SidebarWidget title="VARSLER">
      <div className="space-y-2 flex-1 overflow-y-auto">
        {alerts.slice(0, 8).map((alert) => (
          <button
            key={alert.id}
            onClick={() => handleAlertClick(alert.id)}
            className={`
              w-full text-left px-2 py-1 border-2 transition-all text-xs
              ${selectedAlert === alert.id
                ? 'border-(--gold) bg-(--gold)/10'
                : 'border-(--neon-green)/30 hover:border-(--neon-green)'
              }
            `}
            style={{
              animation: selectedAlert === alert.id ? 'gold-flash 0.3s ease-out' : 'none'
            }}
          >
            <div className="flex items-start gap-2">
              <Icons.Alert
                size={12}
                color={getAlertColor(alert.type) as 'red' | 'green' | 'blue' | 'gray' | 'gold'}
                className="mt-0.5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className={`
                  font-bold truncate
                  ${alert.type === 'kritisk' ? 'text-(--christmas-red)' :
                    alert.type === 'advarsel' ? 'text-(--gold)' :
                      'text-(--cold-blue)'}
                `}>
                  {alert.tekst}
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {alert.tidspunkt}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </SidebarWidget>
  );
}
