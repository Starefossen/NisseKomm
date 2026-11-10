"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGuideAuth } from "./GuideAuth";

const SIDER = [
  ["/nissemor-guide/i-kveld", "I kveld"],
  ["/nissemor-guide/forberedelser", "Forberedelser"],
  ["/nissemor-guide/fasit", "Dag for dag"],
  ["/nissemor-guide/printout", "Utskrifter"],
  ["/nissemor-guide/media", "Media"],
  ["/nissemor-guide/bonusoppdrag", "Bonus"],
  ["/nissemor-guide/brevfugler", "Brev fra barna"],
  ["/nissemor-guide/innstillinger", "Innstillinger"],
] as const;

/** Shared navigation for the parent guide. Wraps to several rows on a phone. */
export function GuideNavigation() {
  const { logout } = useGuideAuth();
  const sti = usePathname();
  return (
    <nav className="max-w-4xl mx-auto mb-6 print:hidden font-retro">
      <ul className="flex flex-wrap gap-2 text-lg">
        {SIDER.map(([href, navn]) => {
          const aktiv = sti === href || sti.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={aktiv ? "page" : undefined}
                className={`flex items-center px-3 min-h-11 border-2 ${
                  aktiv
                    ? "border-(--gold) bg-(--gold) text-black"
                    : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
                }`}
              >
                {navn}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            onClick={logout}
            className="px-3 min-h-11 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20"
          >
            Logg ut
          </button>
        </li>
      </ul>
    </nav>
  );
}
