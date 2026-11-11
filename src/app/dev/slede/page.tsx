import { SledeSimulator } from "@/components/windows/snofall-tv/SledeSimulator";

// Full-screen sledesimulator for testing and FPS measurement; LAN-only via proxy.ts (/dev).
// ?dag=24 opens every stage.
export default async function SledeDevPage({
  searchParams,
}: {
  searchParams: Promise<{ dag?: string }>;
}) {
  const { dag } = await searchParams;
  return (
    <main className="min-h-dvh bg-black flex flex-col">
      <SledeSimulator day={Number(dag) || 24} dev />
    </main>
  );
}
