"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentDate } from "@/lib/date-utils";
import { Icon } from "@/lib/icons";

/** Day of December 1–24 at `offset` days from now, else null. */
function desemberdag(offset: number): number | null {
  const d = getCurrentDate();
  d.setDate(d.getDate() + offset);
  return d.getMonth() === 11 && d.getDate() <= 24 ? d.getDate() : null;
}

/** Shared navigation for the parent guide: one row on a phone. */
export function GuideNavigation() {
  const sti = usePathname();
  const iKveld = desemberdag(1) ?? 1;
  const iDag = desemberdag(0) ?? 1;
  // Before December «I dag» is the pre-season page (24–30 Nov).
  const forSesong = getCurrentDate().getMonth() === 10;
  const dagSti = (n: number) => `/nissemor-guide/dag/${n}`;
  const faner = [
    [`${dagSti(iKveld)}#kveld`, "I kveld", sti === dagSti(iKveld)],
    forSesong
      ? ([
          "/nissemor-guide/forberedelser",
          "I dag",
          sti === "/nissemor-guide/forberedelser",
        ] as const)
      : ([
          dagSti(iDag),
          "I dag",
          sti === dagSti(iDag) && iDag !== iKveld,
        ] as const),
    [
      "/nissemor-guide/dag",
      "Dager",
      sti.startsWith("/nissemor-guide/dag") &&
        sti !== dagSti(iKveld) &&
        sti !== dagSti(iDag),
    ],
    [
      "/nissemor-guide/historien",
      "Historien",
      sti === "/nissemor-guide/historien",
    ],
    [
      "/nissemor-guide/bibliotek",
      "Bibliotek",
      sti === "/nissemor-guide/bibliotek",
    ],
    ["/nissemor-guide/sok", "Søk", sti === "/nissemor-guide/sok"],
  ] as const;
  const tannhjul = sti === "/nissemor-guide/innstillinger";
  const fane = (aktiv: boolean) =>
    `flex items-center justify-center px-2 sm:px-3 min-h-11 min-w-11 border-2 whitespace-nowrap ${
      aktiv
        ? "border-(--gold) bg-(--gold) text-black"
        : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20"
    }`;
  return (
    <nav className="max-w-4xl mx-auto mb-6 print:hidden font-retro">
      {/* Wraps on a phone: seven tabs don't fit in 390 px, and a hidden scroll hides Søk and the gear. */}
      <ul className="flex flex-wrap gap-1 sm:gap-2 text-base sm:text-lg">
        {faner.map(([href, navn, aktiv]) => (
          <li key={navn}>
            <Link
              href={href}
              aria-current={aktiv ? "page" : undefined}
              aria-label={navn}
              className={fane(aktiv)}
            >
              {navn === "Søk" ? (
                <>
                  <Icon
                    name="search"
                    size={20}
                    color={aktiv ? "gray" : "green"}
                    className="sm:hidden"
                  />
                  <span className="hidden sm:inline">Søk</span>
                </>
              ) : (
                navn
              )}
            </Link>
          </li>
        ))}
        <li className="ml-auto">
          <Link
            href="/nissemor-guide/innstillinger"
            aria-label="Innstillinger"
            aria-current={tannhjul ? "page" : undefined}
            className={fane(tannhjul)}
          >
            <Icon
              name="settings-cog"
              size={24}
              color={tannhjul ? "gray" : "green"}
            />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
