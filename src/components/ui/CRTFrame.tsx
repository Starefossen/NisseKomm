import { ReactNode } from "react";

interface CRTFrameProps {
  children: ReactNode;
}

export function CRTFrame({ children }: CRTFrameProps) {
  return (
    <div className="crt-frame-container fixed inset-0 bg-(--crt-bg) overflow-hidden">
      {/* CRT Monitor bezel */}
      <div className="absolute inset-0 border-20 border-black rounded-lg shadow-2xl">
        {/* Main display area with scanlines and vignette */}
        <div className="relative w-full h-full bg-(--crt-bg) scanline-overlay vignette overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
