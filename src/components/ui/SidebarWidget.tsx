import { ReactNode } from "react";

interface SidebarWidgetProps {
  title: string;
  children: ReactNode;
}

export function SidebarWidget({ title, children }: SidebarWidgetProps) {
  return (
    <div className="border-2 border-(--brass)/70 bg-(--dark-crt) flex flex-col flex-1 overflow-hidden">
      {/* Title bar */}
      <div className="px-3 py-1 text-(--brass) border-b border-(--brass)/70">
        <span className="text-lg tracking-wider">{title}</span>
      </div>

      {/* Content */}
      <div className="p-3 text-(--neon-green) text-lg flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
