import SledeSpike from "@/components/windows/snofall-tv/SledeSpike";

// Teknisk spike for sledesimulatoren; LAN-only via proxy.ts (/dev).
export default function SledeSpikePage() {
  return (
    <main className="min-h-dvh bg-black flex items-center justify-center">
      <SledeSpike />
    </main>
  );
}
