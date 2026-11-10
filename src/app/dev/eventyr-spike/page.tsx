import EventyrSpike from "@/components/windows/eventyr-spike/EventyrSpike";

// Spike for «Klementin-Ekspressen»; LAN/dev only via proxy.ts (/dev).
export const metadata = { title: "Eventyr-spike" };

export default function EventyrSpikePage() {
  return <EventyrSpike />;
}
