'use client';

import { useState } from 'react';
import { SidebarWidget } from '../ui/SidebarWidget';
import { LEDIndicator } from '../ui/LEDIndicator';

interface PixelKartProps {
  markerPosition?: { x: number; y: number };
}

export function PixelKart({ markerPosition = { x: 4, y: 1 } }: PixelKartProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const gridSize = 8;

  return (
    <SidebarWidget title="KART">
      <div className="space-y-2">
        {/* Grid */}
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            maxWidth: '200px'
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isMarker = x === markerPosition.x && y === markerPosition.y;
            const _isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

            return (
              <div
                key={index}
                className="relative aspect-square border border-(--neon-green)/30 bg-black/50 cursor-pointer hover:bg-(--neon-green)/10 transition-colors"
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
                title={`${y * 10 + 40}°N, ${x * 10}°E`}
              >
                {isMarker && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LEDIndicator color="red" blinking size={10} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coordinates display */}
        <div className="text-center text-[10px] opacity-70 pt-2 border-t-2 border-(--neon-green)/30">
          {hoveredCell ? (
            <span>
              {hoveredCell.y * 10 + 40}°N, {hoveredCell.x * 10}°E
            </span>
          ) : (
            <span>NORDPOLEN: 90°N, 0°E</span>
          )}
        </div>
      </div>
    </SidebarWidget>
  );
}
