import { ReactNode } from "react";

interface CRTFrameProps {
  children: ReactNode;
}

// Dark wood-and-brass console. Scanlines belong to Snøfall TV and Julius' video only.
export function CRTFrame({ children }: CRTFrameProps) {
  return (
    <div className="crt-frame-container fixed inset-0 bg-(--crt-bg) overflow-hidden">
      <div className="console-bezel absolute inset-0 p-1 md:p-2 lg:p-4">
        <div className="relative w-full h-full bg-(--crt-bg) border-2 border-(--brass)/60 rounded-md overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]">
          {children}
        </div>
      </div>
    </div>
  );
}
