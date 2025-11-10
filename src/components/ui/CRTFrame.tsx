import { ReactNode } from "react";

interface CRTFrameProps {
  children: ReactNode;
}

export function CRTFrame({ children }: CRTFrameProps) {
  return (
    <div className="fixed inset-0 bg-[var(--crt-bg)] overflow-hidden">
      {/* CRT Monitor bezel */}
      <div className="absolute inset-0 border-[20px] border-black rounded-lg shadow-2xl">
        {/* Main display area with scanlines and vignette */}
        <div className="relative w-full h-full bg-[var(--crt-bg)] scanline-overlay vignette overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
