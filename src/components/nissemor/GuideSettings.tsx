"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/lib/icons";

interface EmailSubscriptionStatus {
  subscribed: boolean;
  email?: string;
}

export function GuideSettings() {
  const [emailStatus, setEmailStatus] =
    useState<EmailSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const storageBackend =
    process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

  // Fetch email subscription status on mount
  useEffect(() => {
    async function fetchStatus() {
      if (storageBackend === "localStorage") {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/settings/email-subscription", {
          credentials: "include",
        });

        if (response.ok) {
          const data = (await response.json()) as EmailSubscriptionStatus;
          setEmailStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch email subscription status:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [storageBackend]);

  const handleEmailToggle = async () => {
    if (!emailStatus) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings/email-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscribed: !emailStatus.subscribed }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailStatus({ ...emailStatus, subscribed: !emailStatus.subscribed });
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Kunne ikke oppdatere abonnement",
        });
      }
    } catch (error) {
      console.error("Failed to update email subscription:", error);
      setMessage({ type: "error", text: "Nettverksfeil. Prøv igjen." });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SLETT") {
      setMessage({
        type: "error",
        text: "Skriv 'SLETT' for å bekrefte sletting",
      });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: deleteConfirm }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });

        // Redirect to home page after 3 seconds
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Kunne ikke slette kontoen",
        });
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      setMessage({ type: "error", text: "Nettverksfeil. Prøv igjen." });
    } finally {
      setDeleting(false);
      setDeleteConfirm("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Subscription Section */}
      <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-6">
        <h2 className="text-2xl font-bold text-(--neon-green) mb-4 flex items-center gap-3">
          <Icon name="mail" size={28} />
          E-POSTPÅMINNELSER
        </h2>

        {storageBackend === "localStorage" ? (
          <div className="border-2 border-orange-500 bg-orange-500/10 p-4">
            <p className="text-orange-400">
              ⚠️ E-postabonnement er kun tilgjengelig med Sanity backend.
            </p>
            <p className="text-orange-300/80 text-sm mt-2">
              For å aktivere denne funksjonen, konfigurer
              NEXT_PUBLIC_STORAGE_BACKEND=sanity
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-4">
            <p className="text-(--neon-green)/70">Laster innstillinger...</p>
          </div>
        ) : emailStatus ? (
          <div className="space-y-4">
            <div className="bg-(--dark-crt) border-2 border-(--neon-green)/30 p-4">
              <p className="text-(--neon-green)/90 mb-2">
                <strong>E-postadresse:</strong> {emailStatus.email}
              </p>
              <p className="text-(--neon-green)/70 text-sm">
                Få daglige påminnelser om nye oppdrag klokken 21:00 hver kveld.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleEmailToggle}
                disabled={updating}
                className={`
                  px-6 py-3 border-4 font-bold text-xl transition-all
                  ${emailStatus.subscribed
                    ? "bg-(--neon-green) text-black border-(--neon-green) hover:bg-(--neon-green)/80"
                    : "bg-(--christmas-red) text-white border-(--christmas-red) hover:bg-(--christmas-red)/80"
                  }
                  ${updating ? "opacity-50 cursor-not-allowed" : ""}
                  min-w-[200px]
                `}
              >
                {updating
                  ? "OPPDATERER..."
                  : emailStatus.subscribed
                    ? "✓ ABONNERER"
                    : "✗ AVSLUTTET"}
              </button>

              <button
                onClick={handleEmailToggle}
                disabled={updating}
                className="px-4 py-2 border-2 border-(--neon-green)/50 text-(--neon-green) hover:bg-(--neon-green)/10 transition-colors"
              >
                {emailStatus.subscribed
                  ? "Avslutt abonnement"
                  : "Aktiver abonnement"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Delete Account Section */}
      <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/5 p-6">
        <h2 className="text-2xl font-bold text-(--christmas-red) mb-4 flex items-center gap-3">
          <Icon name="close" size={28} color="red" />
          SLETT KONTO
        </h2>

        <div className="space-y-4">
          <div className="bg-(--dark-crt) border-2 border-(--christmas-red)/30 p-4">
            <p className="text-(--christmas-red) font-bold mb-2">
              ⚠️ ADVARSEL: Dette kan ikke angres!
            </p>
            <p className="text-(--neon-green)/90 text-sm mb-2">
              Sletting av kontoen vil permanent fjerne:
            </p>
            <ul className="list-disc list-inside text-(--neon-green)/70 text-sm space-y-1 ml-4">
              <li>All spillprogresjon (fullførte oppdrag, dagbok, badges)</li>
              <li>Innloggingskoder (både barnekode og foreldrekode)</li>
              <li>E-postabonnement og kontaktinformasjon</li>
              <li>Snill-liste registreringer</li>
            </ul>
            <p className="text-(--christmas-red)/80 text-sm mt-3">
              Dette vil gjøre det umulig å gjenopprette eventyr-opplevelsen for
              denne familien.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="delete-confirm"
                className="block text-(--neon-green) mb-2"
              >
                Skriv <strong className="text-(--gold)">SLETT</strong> for å
                bekrefte:
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                placeholder="SLETT"
                className="w-full px-4 py-2 bg-(--dark-crt) border-2 border-(--christmas-red)/50 text-(--neon-green) font-['VT323',monospace] text-xl focus:border-(--christmas-red) focus:outline-none"
                disabled={deleting}
              />
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== "SLETT"}
              className={`
                w-full px-6 py-4 border-4 border-(--christmas-red) font-bold text-xl transition-all
                ${deleteConfirm === "SLETT" && !deleting
                  ? "bg-(--christmas-red) text-white hover:bg-(--christmas-red)/80"
                  : "bg-(--christmas-red)/20 text-(--christmas-red)/50 cursor-not-allowed"
                }
              `}
            >
              {deleting ? "SLETTER KONTO..." : "🗑️ SLETT KONTO PERMANENT"}
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`
            border-4 p-4 text-center font-bold text-lg
            ${message.type === "success"
              ? "border-(--gold) bg-(--gold)/10 text-(--gold)"
              : "border-(--christmas-red) bg-(--christmas-red)/10 text-(--christmas-red)"
            }
          `}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
