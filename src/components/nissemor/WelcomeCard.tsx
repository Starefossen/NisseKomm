"use client";

import { useState } from "react";

export function WelcomeCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 md:p-6 text-left hover:bg-(--neon-green)/10 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-(--gold)">
              👋 Velkommen, kjære forelder!
            </h2>
            <p className="text-base md:text-lg text-(--neon-green)/90">
              Rampenissen har oppdrag - og du har kontrollpanelet! Her ser du
              hva barna har klart, hva som venter, og får tips til dagens
              forberedelser.
            </p>
            <p className="text-sm md:text-base text-(--neon-green)/80">
              {isExpanded
                ? "Klikk for å skjule detaljer"
                : "Klikk for tips og veiledning"}
              <span className="ml-2">{isExpanded ? "▲" : "▼"}</span>
            </p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 md:p-6 space-y-4 bg-(--dark-crt)/50 border-t-4 border-(--neon-green)/30 animate-[scale-in_0.3s_ease-out]">
          <div className="space-y-3 text-sm md:text-base">
            <p className="text-(--neon-green)/90">
              <strong className="text-(--gold)">
                Tips for en vellykket julekalender:
              </strong>
            </p>
            <ul className="list-none space-y-2 ml-4 text-(--neon-green)/80">
              <li>
                •{" "}
                <strong className="text-(--neon-green)">
                  Les deg opp kvelden før
                </strong>{" "}
                - Sjekk "Kom i Gang" for neste dags oppsett og materialer
              </li>
              <li>
                • <strong className="text-(--neon-green)">Skap spenning</strong>{" "}
                - Rampenissen elsker å gjemme ting på overraskende steder!
              </li>
              <li>
                •{" "}
                <strong className="text-(--neon-green)">
                  Hold det hemmelig
                </strong>{" "}
                - Denne siden viser alle svar - la barna løse gåtene selv
              </li>
              <li>
                •{" "}
                <strong className="text-(--neon-green)">
                  Følg med på aktivitet
                </strong>{" "}
                - Aktivitetsloggen viser når barna gjør fremskritt
              </li>
              <li>
                • <strong className="text-(--neon-green)">Ha det gøy!</strong> -
                Rampenissen kan rote det til, men det er delen av sjarmmen
              </li>
            </ul>

            <div className="border-2 border-(--christmas-red)/50 bg-(--christmas-red)/10 p-4 mt-4">
              <p className="text-(--christmas-red) font-bold">
                🔒 VIKTIG: Hold denne siden hemmelig for barna!
              </p>
              <p className="text-(--neon-green)/80 text-sm mt-2">
                Her finner du alle koder, løsninger og fremtidige oppdrag. La
                barna oppdage og løse gåtene selv - det er der magien skjer!
              </p>
            </div>

            <div className="border-2 border-(--cold-blue)/50 bg-(--cold-blue)/5 p-4 mt-4">
              <p className="text-(--cold-blue) font-bold">
                📚 Trenger du hjelp å komme i gang?
              </p>
              <p className="text-(--neon-green)/80 text-sm mt-2">
                Gå til <strong className="text-(--gold)">"KOM I GANG"</strong> i
                menyen over for detaljert veiledning om oppsett, daglig
                planlegging og hvordan de ulike elementene i spillet fungerer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
