"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { Icons } from "@/lib/icons";
import { clearParentAuth } from "@/lib/session-manager";
import { useRouter } from "next/navigation";
import type { CalendarEvent } from "@/types/innhold";

interface FamilyData {
  familyName: string;
  kidNames: string[];
  friendNames: string[];
  parentEmail: string;
  kidCode: string;
  parentCode: string;
  createdAt: string;
  calendarEvents: CalendarEvent[];
}

function InnstillingerContent() {
  const router = useRouter();
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    familyName: "",
    kidNames: [""],
    friendNames: [] as string[],
    parentEmail: "",
    calendarEvents: [] as CalendarEvent[],
  });

  // Fetch family data on mount
  useEffect(() => {
    async function fetchFamilyData() {
      try {
        const response = await fetch("/api/auth/family", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 403) {
            setError("Du må være logget inn som forelder for å se denne siden");
          } else if (response.status === 404) {
            setError(
              "Ingen familieregistrering funnet. Gå til /register for å registrere deg først.",
            );
          } else {
            setError("Kunne ikke hente familieinformasjon");
          }
          return;
        }

        const data = (await response.json()) as FamilyData;
        setFamilyData(data);
        setFormData({
          familyName: data.familyName,
          kidNames: data.kidNames.length > 0 ? data.kidNames : [""],
          friendNames: data.friendNames,
          parentEmail: data.parentEmail,
          calendarEvents: data.calendarEvents || [],
        });
      } catch (err) {
        console.error("Failed to fetch family data:", err);
        setError("Nettverksfeil - prøv igjen senere");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFamilyData();
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddKidName = () => {
    if (formData.kidNames.length < 4) {
      setFormData({
        ...formData,
        kidNames: [...formData.kidNames, ""],
      });
    }
  };

  const handleRemoveKidName = (index: number) => {
    if (formData.kidNames.length > 1) {
      setFormData({
        ...formData,
        kidNames: formData.kidNames.filter((_, i) => i !== index),
      });
    }
  };

  const handleKidNameChange = (index: number, value: string) => {
    const newKidNames = [...formData.kidNames];
    newKidNames[index] = value;
    setFormData({ ...formData, kidNames: newKidNames });
  };

  const handleAddFriendName = () => {
    if (formData.friendNames.length < 15) {
      setFormData({
        ...formData,
        friendNames: [...formData.friendNames, ""],
      });
    }
  };

  const handleRemoveFriendName = (index: number) => {
    setFormData({
      ...formData,
      friendNames: formData.friendNames.filter((_, i) => i !== index),
    });
  };

  const handleFriendNameChange = (index: number, value: string) => {
    const newFriendNames = [...formData.friendNames];
    newFriendNames[index] = value;
    setFormData({ ...formData, friendNames: newFriendNames });
  };

  // Calendar Event handlers
  const handleAddCalendarEvent = () => {
    if (formData.calendarEvents.length < 24) {
      // Find first available day not already used
      const usedDays = new Set(formData.calendarEvents.map((e) => e.dag));
      let availableDay = 1;
      for (let i = 1; i <= 24; i++) {
        if (!usedDays.has(i)) {
          availableDay = i;
          break;
        }
      }
      setFormData({
        ...formData,
        calendarEvents: [
          ...formData.calendarEvents,
          { dag: availableDay, hendelse: "" },
        ],
      });
    }
  };

  const handleRemoveCalendarEvent = (index: number) => {
    setFormData({
      ...formData,
      calendarEvents: formData.calendarEvents.filter((_, i) => i !== index),
    });
  };

  const handleCalendarEventDayChange = (index: number, day: number) => {
    const newEvents = [...formData.calendarEvents];
    newEvents[index] = { ...newEvents[index], dag: day };
    setFormData({ ...formData, calendarEvents: newEvents });
  };

  const handleCalendarEventTextChange = (index: number, text: string) => {
    const newEvents = [...formData.calendarEvents];
    newEvents[index] = { ...newEvents[index], hendelse: text };
    setFormData({ ...formData, calendarEvents: newEvents });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          familyName: formData.familyName,
          kidNames: formData.kidNames.filter((n) => n.trim()),
          friendNames: formData.friendNames.filter((n) => n.trim()),
          parentEmail: formData.parentEmail,
          calendarEvents: formData.calendarEvents.filter((e) =>
            e.hendelse.trim(),
          ),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lagring mislyktes");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearParentAuth();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
        <div className="text-2xl">Laster innstillinger...</div>
      </div>
    );
  }

  if (error && !familyData) {
    return (
      <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-8">
        <div className="max-w-2xl mx-auto">
          <div className="border-4 border-(--neon-red) bg-(--neon-red)/10 p-6">
            <p className="text-(--neon-red) font-bold text-xl">⚠️ {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="innstillinger" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-8 border-(--neon-green) bg-black p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Icons.Sliders size={40} color="green" />
            <h1 className="text-4xl font-bold text-(--neon-green) tracking-wider">
              FAMILIEINNSTILLINGER
            </h1>
            <Icons.Sliders size={40} color="green" />
          </div>
          <p className="text-center text-(--neon-green)/70">
            Administrer familiens NisseKomm-konto
          </p>
        </div>

        {/* Access Codes (Read-only) */}
        <div className="border-4 border-(--gold) bg-black p-6 mb-6">
          <h2 className="text-2xl font-bold text-(--gold) mb-4 flex items-center gap-2">
            <Icons.Lock size={24} color="gold" />
            TILGANGSKODER
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kid Code */}
            <div className="border-2 border-(--neon-green) p-4">
              <div className="text-sm text-(--neon-green)/70 mb-2">
                BARNEKODE
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xl text-(--gold) bg-black/50 p-2 tracking-widest">
                  {familyData?.kidCode}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(familyData?.kidCode || "", "kidCode")
                  }
                  className={`p-2 border-2 transition-colors ${copiedField === "kidCode"
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green) hover:text-black"
                    }`}
                  title="Kopier barnekode"
                >
                  {copiedField === "kidCode" ? "✓" : <Icons.File size={16} />}
                </button>
              </div>
            </div>

            {/* Parent Code */}
            <div className="border-2 border-(--cold-blue) p-4">
              <div className="text-sm text-(--cold-blue)/70 mb-2">
                FORELDREKODE
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xl text-(--gold) bg-black/50 p-2 tracking-widest">
                  {familyData?.parentCode}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(familyData?.parentCode || "", "parentCode")
                  }
                  className={`p-2 border-2 transition-colors ${copiedField === "parentCode"
                      ? "border-(--gold) bg-(--gold) text-black"
                      : "border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue) hover:text-black"
                    }`}
                  title="Kopier foreldrekode"
                >
                  {copiedField === "parentCode" ? (
                    "✓"
                  ) : (
                    <Icons.File size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-(--neon-green)/50 mt-4 text-center">
            Kodene kan ikke endres. Ta vare på dem et trygt sted.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="border-4 border-(--neon-red) bg-(--neon-red)/10 p-4 mb-6">
            <p className="text-(--neon-red) font-bold">⚠️ {error}</p>
          </div>
        )}

        {/* Success Display */}
        {saveSuccess && (
          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4 mb-6">
            <p className="text-(--gold) font-bold">✓ Endringene er lagret!</p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Family Name */}
          <div className="border-4 border-(--neon-green)/30 p-6">
            <label className="block mb-2">
              <span className="text-(--gold) font-bold">FAMILIENAVN</span>
              <span className="text-xs text-(--neon-green)/50 ml-2">
                Maks 50 tegn
              </span>
            </label>
            <input
              type="text"
              value={formData.familyName}
              onChange={(e) =>
                setFormData({ ...formData, familyName: e.target.value })
              }
              maxLength={50}
              className="w-full px-4 py-3 bg-black border-2 border-(--neon-green) text-(--neon-green) text-xl focus:outline-none focus:border-(--gold) uppercase"
            />
          </div>

          {/* Kid Names */}
          <div className="border-4 border-(--gold) p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-(--gold) font-bold text-lg">
                  BARNAS NAVN
                </span>
                <span className="text-xs text-(--gold)/50 ml-2">
                  1-4 navn, maks 20 tegn
                </span>
              </div>
              {formData.kidNames.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddKidName}
                  className="px-4 py-2 border-2 border-(--gold) text-(--gold) hover:bg-(--gold) hover:text-black transition-colors text-sm"
                >
                  + LEGG TIL
                </button>
              )}
            </div>
            <div className="space-y-3">
              {formData.kidNames.map((name, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-(--gold) font-bold w-6">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleKidNameChange(index, e.target.value)}
                    maxLength={20}
                    placeholder={`Barnenavn ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-black border-2 border-(--gold) text-(--gold) focus:outline-none focus:border-(--neon-green) uppercase"
                  />
                  <span className="text-xs text-(--gold)/50 w-12 text-right">
                    {name.length}/20
                  </span>
                  {formData.kidNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKidName(index)}
                      className="px-3 py-2 border-2 border-(--neon-red) bg-black text-(--neon-red) hover:bg-(--neon-red) hover:text-black transition-all font-bold text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Friend Names */}
          <div className="border-4 border-(--cold-blue)/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-(--cold-blue) font-bold text-lg">
                  VENNER
                </span>
                <span className="text-xs text-(--cold-blue)/50 ml-2">
                  0-15 navn for Julius' snill-liste
                </span>
              </div>
              {formData.friendNames.length < 15 && (
                <button
                  type="button"
                  onClick={handleAddFriendName}
                  className="px-4 py-2 border-2 border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue) hover:text-black transition-colors text-sm"
                >
                  + LEGG TIL VENN
                </button>
              )}
            </div>
            {formData.friendNames.length === 0 ? (
              <p className="text-(--cold-blue)/50 text-sm text-center py-4">
                Ingen venner lagt til ennå. Klikk &quot;+ LEGG TIL VENN&quot;
                for å legge til.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.friendNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-(--cold-blue) text-sm w-8">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        handleFriendNameChange(index, e.target.value)
                      }
                      maxLength={20}
                      placeholder={`Vennenavn ${index + 1}`}
                      className="flex-1 px-4 py-2 bg-black border-2 border-(--cold-blue) text-(--cold-blue) focus:outline-none focus:border-(--neon-green) uppercase text-sm"
                    />
                    <span className="text-xs text-(--cold-blue)/50 w-12 text-right">
                      {name.length}/20
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriendName(index)}
                      className="px-3 py-2 border-2 border-(--neon-red) bg-black text-(--neon-red) hover:bg-(--neon-red) hover:text-black transition-all font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Events */}
          <div className="border-4 border-(--christmas-red)/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-(--christmas-red) font-bold text-lg flex items-center gap-2">
                  <Icons.Calendar size={20} color="red" />
                  KALENDERHENDELSER
                </span>
                <span className="text-xs text-(--christmas-red)/50 ml-2 block mt-1">
                  Legg til familiens egne hendelser (bursdager, turer, etc.)
                </span>
              </div>
              {formData.calendarEvents.length < 24 && (
                <button
                  type="button"
                  onClick={handleAddCalendarEvent}
                  className="px-4 py-2 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red) hover:text-white transition-colors text-sm"
                >
                  + LEGG TIL
                </button>
              )}
            </div>
            {formData.calendarEvents.length === 0 ? (
              <p className="text-(--christmas-red)/50 text-sm text-center py-4">
                Ingen egne hendelser lagt til. Klikk &quot;+ LEGG TIL&quot; for
                å legge til familieaktiviteter i kalenderen.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.calendarEvents.map((event, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <select
                      value={event.dag}
                      onChange={(e) =>
                        handleCalendarEventDayChange(
                          index,
                          parseInt(e.target.value),
                        )
                      }
                      className="w-20 px-2 py-2 bg-black border-2 border-(--christmas-red) text-(--christmas-red) focus:outline-none focus:border-(--gold) text-center"
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).map(
                        (day) => (
                          <option key={day} value={day}>
                            {day}. des
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      type="text"
                      value={event.hendelse}
                      onChange={(e) =>
                        handleCalendarEventTextChange(index, e.target.value)
                      }
                      maxLength={50}
                      placeholder="Beskriv hendelsen..."
                      className="flex-1 px-4 py-2 bg-black border-2 border-(--christmas-red) text-(--christmas-red) focus:outline-none focus:border-(--gold)"
                    />
                    <span className="text-xs text-(--christmas-red)/50 w-12 text-right">
                      {event.hendelse.length}/50
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCalendarEvent(index)}
                      className="px-3 py-2 border-2 border-(--neon-red) bg-black text-(--neon-red) hover:bg-(--neon-red) hover:text-black transition-all font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parent Email */}
          <div className="border-4 border-(--neon-green)/30 p-6">
            <label className="block mb-2">
              <span className="text-(--gold) font-bold">E-POST</span>
              <span className="text-xs text-(--neon-green)/50 ml-2">
                For fremtidig gjenoppretting
              </span>
            </label>
            <input
              type="email"
              value={formData.parentEmail}
              onChange={(e) =>
                setFormData({ ...formData, parentEmail: e.target.value })
              }
              placeholder="forelder@example.com"
              className="w-full px-4 py-3 bg-black border-2 border-(--neon-green) text-(--neon-green) text-xl focus:outline-none focus:border-(--gold)"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-8 py-4 border-4 border-(--gold) bg-(--gold) text-black text-xl font-bold tracking-wider hover:bg-transparent hover:text-(--gold) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSaving && (
              <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
            )}
            {isSaving ? "LAGRER..." : "LAGRE ENDRINGER"}
          </button>
        </form>

        {/* Account Info */}
        <div className="border-4 border-(--neon-green)/20 p-6 mt-6">
          <h3 className="text-(--neon-green)/70 font-bold mb-2">
            KONTOINFORMASJON
          </h3>
          <p className="text-(--neon-green)/50 text-sm">
            Opprettet:{" "}
            {familyData?.createdAt
              ? new Date(familyData.createdAt).toLocaleDateString("nb-NO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              : "Ukjent"}
          </p>
        </div>

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="px-8 py-3 border-4 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red) hover:text-white transition-colors font-bold tracking-wider"
          >
            🚪 LOGG UT FRA FORELDREVEILEDNING
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InnstillingerPage() {
  return (
    <GuideAuth>
      <Suspense
        fallback={
          <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
            <div className="text-2xl">Laster...</div>
          </div>
        }
      >
        <InnstillingerContent />
      </Suspense>
    </GuideAuth>
  );
}
