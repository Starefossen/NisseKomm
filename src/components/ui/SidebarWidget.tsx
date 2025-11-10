import { ReactNode } from "react";

interface SidebarWidgetProps {
  title: string;
  children: ReactNode;
}

export function SidebarWidget({ title, children }: SidebarWidgetProps) {
  return (
    <div className="border-4 border-(--neon-green) bg-black/50 shadow-[0_0_10px_rgba(0,255,0,0.2)] flex flex-col flex-1 overflow-hidden">
      {/* Title bar */}
      <div className="px-3 py-1 bg-(--neon-green) text-black border-b-4 border-(--neon-green)">
        <span className="text-base font-bold tracking-wider">{title}</span>
      </div>

      {/* Content */}
      <div className="p-3 text-(--neon-green) text-sm flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
