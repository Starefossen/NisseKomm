"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useGuideAuth } from "./GuideAuth";

/**
 * GuideNavigation Component
 *
 * Shared navigation bar for all nissemor-guide pages.
 * Shows links to main sections with a dropdown for less-used items.
 * Uses session-based authentication (no URL parameters needed).
 *
 * Usage:
 * <GuideNavigation currentPage="hovedside" />
 */

type PageType =
  | "hovedside"
  | "symboler"
  | "eventyr"
  | "utvikling"
  | "handleliste"
  | "printout"
  | "brevfugler"
  | "bonusoppdrag"
  | "merker"
  | "innstillinger";

interface GuideNavigationProps {
  currentPage: PageType;
}

export function GuideNavigation({ currentPage }: GuideNavigationProps) {
  const { logout } = useGuideAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Main navigation pages (always visible)
  const mainPages = [
    {
      id: "hovedside" as PageType,
      label: "📋 HOVEDSIDE",
      href: "/nissemor-guide",
      color: "bg-(--neon-green) text-black hover:bg-(--gold)",
    },
    {
      id: "brevfugler" as PageType,
      label: "✉️ BREVFUGLER",
      href: "/nissemor-guide/brevfugler",
      color: "bg-pink-600 text-white hover:bg-pink-500",
    },
    {
      id: "bonusoppdrag" as PageType,
      label: "🏅 BONUSOPPDRAG",
      href: "/nissemor-guide/bonusoppdrag",
      color: "bg-orange-600 text-white hover:bg-orange-500",
    },
    {
      id: "merker" as PageType,
      label: "🏆 MERKER",
      href: "/nissemor-guide/merker",
      color: "bg-(--gold) text-black hover:bg-(--gold)/80",
    },
    {
      id: "symboler" as PageType,
      label: "🎁 SYMBOLER",
      href: "/nissemor-guide/symboler",
      color: "bg-purple-600 text-white hover:bg-purple-500",
    },
    {
      id: "eventyr" as PageType,
      label: "📖 EVENTYR",
      href: "/nissemor-guide/eventyr",
      color: "bg-(--cold-blue) text-black hover:bg-(--gold)",
    },
  ];

  // Dropdown menu items
  const menuItems = [
    {
      id: "handleliste" as PageType,
      label: "🛒 HANDLELISTE",
      href: "/nissemor-guide/handleliste",
    },
    {
      id: "printout" as PageType,
      label: "🖨️ UTSKRIFTER",
      href: "/nissemor-guide/printout",
    },
    {
      id: "innstillinger" as PageType,
      label: "⚙️ INNSTILLINGER",
      href: "/nissemor-guide/innstillinger",
    },
    {
      id: "utvikling" as PageType,
      label: "🔧 UTVIKLING",
      href: "/nissemor-guide/utvikling",
    },
  ];

  // Check if current page is in the dropdown menu
  const isDropdownPageActive = menuItems.some(
    (item) => item.id === currentPage,
  );

  return (
    <nav className="max-w-7xl mx-auto mb-6 print:hidden">
      <div className="flex gap-2 justify-center flex-wrap items-center">
        {mainPages.map((page) => (
          <Link
            key={page.id}
            href={page.href}
            className={`px-4 py-2 font-bold text-base border-2 border-black transition-colors ${page.color} ${currentPage === page.id ? "ring-4 ring-(--gold)" : ""
              }`}
          >
            {page.label}
          </Link>
        ))}

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`px-4 py-2 font-bold text-base border-2 border-black transition-colors bg-gray-700 text-white hover:bg-gray-600 ${isDropdownPageActive ? "ring-4 ring-(--gold)" : ""
              }`}
          >
            ☰ MER {isMenuOpen ? "▲" : "▼"}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 border-2 border-(--neon-green) shadow-lg z-50">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 font-bold text-base hover:bg-(--neon-green)/20 transition-colors border-b border-gray-700 last:border-b-0 ${currentPage === item.id
                      ? "bg-(--neon-green)/30 text-(--gold)"
                      : "text-(--neon-green)"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-3 font-bold text-base bg-(--christmas-red)/80 text-white hover:bg-(--christmas-red) transition-colors"
              >
                🚪 LOGG UT
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
