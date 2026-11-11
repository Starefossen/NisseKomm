import {
  SledefluktSpill,
  type Oppløsning,
} from "@/components/windows/sledeflukt/Sledeflukt";

/**
 * Dev page (lan mode) for measuring SLEDEFLUKT on the iPad:
 * /dev/sledeflukt?dag=24&res=320. Without res the game picks 480 and falls back on its own.
 */
export default async function SledefluktDevPage({
  searchParams,
}: {
  searchParams: Promise<{ dag?: string; res?: string }>;
}) {
  const sp = await searchParams;
  const day = Math.min(24, Math.max(8, Number(sp.dag) || 24));
  const res: Oppløsning | undefined =
    sp.res === "320" ? 320 : sp.res === "480" ? 480 : undefined;
  return (
    <main className="min-h-dvh bg-black flex flex-col items-center justify-center gap-2 p-2">
      <div className="w-full landscape:w-[min(100%,calc((100dvh-3rem)*16/9))]">
        <SledefluktSpill day={day} fps oppløsning={res} />
      </div>
      <p className="font-retro text-(--neon-green)/70 text-base">
        ?dag=8–24 · ?res=480 eller 320 (uten: automatisk)
      </p>
    </main>
  );
}
