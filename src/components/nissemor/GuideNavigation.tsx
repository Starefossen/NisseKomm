"use client";

import Link from "next/link";
import { useGuideAuth } from "./GuideAuth";

/**
 * GuideNavigation Component
 *
 * Shared navigation bar for all nissemor-guide pages.
 * Shows links to main sections: Hovedside, Symboler, Eventyr, Utvikling.
 * Automatically passes ?kode= parameter through all links.
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
  | "merker";

interface GuideNavigationProps {
  currentPage: PageType;
}

export function GuideNavigation({ currentPage }: GuideNavigationProps) {
  const { kode } = useGuideAuth();

  const pages = [
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
    {
      id: "utvikling" as PageType,
      label: "🔧 UTVIKLING",
      href: "/nissemor-guide/utvikling",
      color: "bg-(--christmas-red) text-white hover:bg-(--christmas-red)/80",
    },
  ];

  return (
    <nav className="max-w-6xl mx-auto mb-6 print:hidden">
      <div className="flex gap-4 justify-center flex-wrap">
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`${page.href}?kode=${kode}`}
            className={`px-6 py-3 font-bold text-lg border-2 border-black transition-colors ${page.color} ${
              currentPage === page.id ? "ring-4 ring-(--gold)" : ""
            }`}
          >
            {page.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
