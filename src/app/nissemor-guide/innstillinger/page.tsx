"use client";

import { useRouter } from "next/navigation";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GuideSettings } from "@/components/nissemor/GuideSettings";
import { Icons } from "@/lib/icons";
import { clearParentAuth } from "@/lib/auth-cookies";

function InnstillingerContent() {
  const router = useRouter();

  const handleLogout = () => {
    clearParentAuth();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="innstillinger" />

      <div className="max-w-4xl mx-auto">
        <div className="border-8 border-(--neon-green) bg-black p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            <Icons.Sliders size={40} color="green" />
            <h1 className="text-4xl font-bold text-(--neon-green) tracking-wider">
              INNSTILLINGER
            </h1>
            <Icons.Sliders size={40} color="green" />
          </div>
        </div>

        <GuideSettings />

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
      <InnstillingerContent />
    </GuideAuth>
  );
}
