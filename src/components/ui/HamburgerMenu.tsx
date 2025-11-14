"use client";

import { Icon } from "@/lib/icons";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HamburgerMenu({ isOpen, onClick }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center bg-(--dark-crt) border-2 border-(--neon-green) hover:bg-(--neon-green) hover:border-(--neon-green) active:scale-95 transition-all"
      aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
    >
      <Icon name={isOpen ? "close" : "menu"} size={24} color="green" />
    </button>
  );
}
