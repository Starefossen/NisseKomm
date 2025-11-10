"use client";

import { SidebarWidget } from "../ui/SidebarWidget";
import { StatusBar } from "../ui/StatusBar";
import { LEDIndicator } from "../ui/LEDIndicator";
import { Icons } from "@/lib/icons";
import { SystemMetrikk } from "@/types/innhold";

interface SystemStatusProps {
  metrics: SystemMetrikk[];
}

export function SystemStatus({ metrics }: SystemStatusProps) {
  return (
    <SidebarWidget title="SYSTEMSTATUS">
      <div className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 pb-3 border-b-2 border-(--neon-green)/30">
          <LEDIndicator color="red" blinking />
          <span className="text-xs">JULESIGNAL: USTABIL</span>
          <Icons.Warning size={16} color="red" />
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <StatusBar
              key={index}
              label={metric.navn}
              value={metric.verdi}
              max={metric.maks}
              status={metric.status}
            />
          ))}
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-(--neon-green)/30 text-xs">
          <span>ENISSEKJERNE 3.8]</span>
          <LEDIndicator color="green" blinking />
        </div>
      </div>
    </SidebarWidget>
  );
}
