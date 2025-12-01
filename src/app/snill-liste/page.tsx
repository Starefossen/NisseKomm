"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icons";

interface RegistrationFormData {
  familyName: string;
  kidNames: string[];
  friendNames: string[];
  parentEmail: string;
}

interface GeneratedCodes {
  kidCode: string;
  parentCode: string;
  sessionId: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    familyName: "",
    kidNames: [""],
    friendNames: [],
    parentEmail: "",
  });
  const [shareKey, setShareKey] = useState("");

  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCodes | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareKeyRequired, setShareKeyRequired] = useState(false);

  // Fetch share key requirement from server
  useEffect(() => {
    fetch("/api/auth/share-key-required")
      .then((res) => res.json())
      .then((data: { required: boolean }) => {
        setShareKeyRequired(data.required);
      })
      .catch(() => {
        // Default to false if fetch fails
        setShareKeyRequired(false);
      });
  }, []);

  const handleAddKidName = () => {
    if (formData.kidNames.length < 4) {
      setFormData({
        ...formData,
        kidNames: [...formData.kidNames, ""],
      });
    }
  };

  const handleKidNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && formData.kidNames.length < 4) {
      e.preventDefault();
      handleAddKidName();
    }
  };

  const handleRemoveKidName = (index: number) => {
    setFormData({
      ...formData,
      kidNames: formData.kidNames.filter((_, i) => i !== index),
    });
  };

  const handleAddFriendName = () => {
    if (formData.friendNames.length < 15) {
      setFormData({
        ...formData,
        friendNames: [...formData.friendNames, ""],
      });
    }
  };

  const handleFriendNameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && formData.friendNames.length < 15) {
      e.preventDefault();
      handleAddFriendName();
    }
  };

  const handleRemoveFriendName = (index: number) => {
    setFormData({
      ...formData,
      friendNames: formData.friendNames.filter((_, i) => i !== index),
    });
  };

  const handleKidNameChange = (index: number, value: string) => {
    const newKidNames = [...formData.kidNames];
    newKidNames[index] = value;
    setFormData({ ...formData, kidNames: newKidNames });
  };

  const handleFriendNameChange = (index: number, value: string) => {
    const newFriendNames = [...formData.friendNames];
    newFriendNames[index] = value;
    setFormData({ ...formData, friendNames: newFriendNames });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Filter out empty names
      const validKidNames = formData.kidNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      const validFriendNames = formData.friendNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (!formData.familyName.trim()) {
        setError("Familienavn er påkrevd");
        setIsSubmitting(false);
        return;
      }

      if (validKidNames.length === 0) {
        setError("Legg til minst ett barnenavn");
        setIsSubmitting(false);
        return;
      }

      if (!formData.parentEmail.trim()) {
        setError("E-postadresse er påkrevd");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: formData.familyName.trim() || undefined,
          kidNames: validKidNames,
          friendNames: validFriendNames,
          parentEmail: formData.parentEmail.trim() || undefined,
          shareKey: shareKeyRequired ? shareKey : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registrering mislyktes");
      }

      const codes = await response.json();
      setGeneratedCodes(codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Save codes to localStorage as backup (1 hour expiry)
  if (generatedCodes) {
    // Store codes temporarily
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "TEMP_REGISTRATION_CODES",
        JSON.stringify({
          ...generatedCodes,
          timestamp: Date.now(),
        }),
      );

      // Auto-clear after 1 hour
      setTimeout(
        () => {
          localStorage.removeItem("TEMP_REGISTRATION_CODES");
        },
        60 * 60 * 1000,
      );
    }

    // Warning before leaving page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Har du lagret kodene dine?";
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return (
      <div className="min-h-screen bg-black p-4 md:p-8 font-mono">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="border-8 border-(--gold) bg-black p-6 mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Icons.Star size={40} color="gold" />
              <h1 className="text-4xl font-bold text-(--gold) tracking-wider">
                REGISTRERING FULLFØRT
              </h1>
              <Icons.Star size={40} color="gold" />
            </div>
            <p className="text-center text-(--neon-green) text-lg">
              Familiens NisseKomm-tilgang er opprettet!
            </p>
          </div>

          {/* Kid Code */}
          <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-6 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Icons.Gift size={24} color="green" />
              <h2 className="text-2xl font-bold text-(--neon-green)">
                BARNEKODE
              </h2>
            </div>
            <p className="text-sm text-(--neon-green)/70 mb-4">
              Barna bruker denne koden til å logge inn:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black border-2 border-(--neon-green) p-4">
                <code className="text-2xl font-bold text-(--gold) tracking-widest">
                  {generatedCodes.kidCode}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(generatedCodes.kidCode)}
                className="px-4 py-4 border-2 border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green) hover:text-black transition-colors"
                title="Kopier barnekode"
              >
                <Icons.File size={20} />
              </button>
            </div>
          </div>

          {/* Parent Code */}
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Icons.Lock size={24} color="blue" />
              <h2 className="text-2xl font-bold text-(--cold-blue)">
                FORELDREKODE
              </h2>
            </div>
            <p className="text-sm text-(--cold-blue)/70 mb-4">
              Din private kode for tilgang til Nissemor-guiden:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black border-2 border-(--cold-blue) p-4">
                <code className="text-2xl font-bold text-(--gold) tracking-widest">
                  {generatedCodes.parentCode}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(generatedCodes.parentCode)}
                className="px-4 py-4 border-2 border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue) hover:text-black transition-colors"
                title="Kopier foreldrekode"
              >
                <Icons.File size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link
              href="/"
              className="px-6 py-4 border-4 border-(--neon-green) bg-(--neon-green) text-black text-center font-bold tracking-wider hover:bg-transparent hover:text-(--neon-green) transition-colors flex items-center justify-center gap-2"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(
                    "PREFILL_CODE",
                    generatedCodes.kidCode,
                  );
                }
              }}
            >
              ÅPNE NISSEKOMM →
            </Link>
            <Link
              href="/nissemor-guide"
              className="px-6 py-4 border-4 border-(--cold-blue) bg-(--cold-blue) text-black text-center font-bold tracking-wider hover:bg-transparent hover:text-(--cold-blue) transition-colors flex items-center justify-center gap-2"
            >
              ÅPNE NISSEMOR-GUIDE →
            </Link>
          </div>

          {/* Copy Both Button */}
          <button
            onClick={() => {
              copyToClipboard(
                `Barnekode: ${generatedCodes.kidCode}\nForeldrekode: ${generatedCodes.parentCode}`,
              );
            }}
            className="w-full px-6 py-4 border-4 border-(--gold) text-(--gold) hover:bg-(--gold) hover:text-black font-bold tracking-wider transition-colors mb-6"
          >
            KOPIER BEGGE KODENE
          </button>

          {/* Important Info */}
          <div className="border-4 border-(--neon-green)/30 bg-(--neon-green)/5 p-6">
            <h3 className="text-xl font-bold text-(--gold) mb-4">
              📋 VIKTIG INFORMASJON
            </h3>
            <ul className="space-y-2 text-(--neon-green) text-sm">
              <li className="flex items-start gap-2">
                <span className="text-(--gold)">•</span>
                <span>
                  Lagre begge kodene et trygt sted - de kan ikke gjenopprettes
                  senere
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-(--gold)">•</span>
                <span>
                  Samme koder fungerer på alle enheter (tablet, PC, mobil)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-(--gold)">•</span>
                <span>Barnekoden deles med barna for daglig innlogging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-(--gold)">•</span>
                <span>
                  Foreldrekoden holder du privat for å lese Nissemor-guiden
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-8 border-(--neon-green) bg-black p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Icons.Snowflake size={40} color="green" />
            <h1 className="text-4xl font-bold text-(--neon-green) tracking-wider">
              NISSEKOMM REGISTRERING
            </h1>
            <Icons.Snowflake size={40} color="green" />
          </div>
          <p className="text-center text-(--neon-green)/70">
            Opprett familiens tilgang til Julius' kommandosenter
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-4 border-(--neon-red) bg-(--neon-red)/10 p-4 mb-6">
            <p className="text-(--neon-red) font-bold">⚠️ {error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Share Key (if required) */}
          {shareKeyRequired && (
            <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
              <label className="block mb-2">
                <span className="text-(--gold) font-bold">
                  REGISTRERINGSNØKKEL *
                </span>
                <span className="text-xs text-(--gold)/50 ml-2">
                  Påkrevd - mottatt fra arrangør
                </span>
              </label>
              <input
                type="text"
                value={shareKey}
                onChange={(e) => setShareKey(e.target.value.toUpperCase())}
                required
                placeholder="SKRIV INN NØKKEL HER"
                className="w-full px-4 py-3 bg-black border-2 border-(--gold) text-(--gold) text-xl focus:outline-none focus:border-(--neon-green) uppercase tracking-wider"
              />
            </div>
          )}

          {/* Family Name */}
          <div className="border-4 border-(--neon-green)/30 p-6">
            <label className="block mb-2">
              <span className="text-(--gold) font-bold">FAMILIENAVN *</span>
              <span className="text-xs text-(--neon-green)/50 ml-2">
                Påkrevd - maks 50 tegn
              </span>
            </label>
            <input
              type="text"
              value={formData.familyName}
              onChange={(e) =>
                setFormData({ ...formData, familyName: e.target.value })
              }
              required
              maxLength={50}
              placeholder="Familie Hansen"
              className="w-full px-4 py-3 bg-black border-2 border-(--neon-green) text-(--neon-green) text-xl focus:outline-none focus:border-(--gold) uppercase"
            />
          </div>

          {/* Kid Names */}
          <div className="border-4 border-(--gold) p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-(--gold) font-bold text-lg">
                  BARNAS NAVN *
                </span>
                <span className="text-xs text-(--gold)/50 ml-2">
                  Påkrevd - minst 1 navn, maks 4
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
                    onKeyDown={(e) => handleKidNameKeyDown(e)}
                    maxLength={20}
                    placeholder={`Barnenavn ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-black border-2 border-(--gold) text-(--gold) focus:outline-none focus:border-(--neon-green) uppercase"
                    required={index === 0}
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
                  VENNER (valgfritt)
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
                Ingen venner lagt til ennå. Klikk "+ LEGG TIL VENN" for å legge
                til.
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
                      onKeyDown={(e) => handleFriendNameKeyDown(e)}
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

          {/* Parent Email */}
          <div className="border-4 border-(--neon-green)/30 p-6">
            <label className="block mb-2">
              <span className="text-(--gold) font-bold">E-POST *</span>
              <span className="text-xs text-(--neon-green)/50 ml-2">
                Påkrevd - for fremtidig gjenoppretting
              </span>
            </label>
            <input
              type="email"
              value={formData.parentEmail}
              onChange={(e) =>
                setFormData({ ...formData, parentEmail: e.target.value })
              }
              required
              placeholder="forelder@example.com"
              className="w-full px-4 py-3 bg-black border-2 border-(--neon-green) text-(--neon-green) text-xl focus:outline-none focus:border-(--gold)"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-8 py-4 border-4 border-(--gold) bg-(--gold) text-black text-xl font-bold tracking-wider hover:bg-transparent hover:text-(--gold) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSubmitting && (
              <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? "OPPRETTER..." : "OPPRETT FAMILIETILGANG"}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-(--neon-green)/30 border-t-2 border-(--neon-green)/20 pt-4">
          <p>* = Påkrevd felt</p>
          <p className="mt-2">
            Etter registrering får du to koder: barnekode og foreldrekode.
          </p>
          <p className="mt-1">
            Lagre kodene et trygt sted - de kan ikke gjenopprettes senere.
          </p>
        </div>
      </div>
    </div>
  );
}
