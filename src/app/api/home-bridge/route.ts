import { NextRequest, NextResponse } from "next/server";
import { getISOString } from "@/lib/date-utils";

interface HomeBridgePayload {
  day: number;
  code: string;
  event?: "quest_completed" | "minigame_cleared";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HomeBridgePayload;
    const { day, code, event = "quest_completed" } = body;

    if (!day || !code) {
      return NextResponse.json(
        { error: "Missing day or code" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const dispatched: string[] = [];

    // 1. Optional Skjerm/Varden status webhook for family dashboard
    const skjermWebhookUrl = process.env.SKJERM_WEBHOOK_URL;
    if (skjermWebhookUrl) {
      await fetch(skjermWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "nissekomm",
          season: 2026,
          event,
          day,
          code: normalizedCode,
          message: `Luka ${day} løst i NisseKomm (${normalizedCode})`,
          timestamp: getISOString(),
        }),
      }).catch(() => null);
      dispatched.push("skjerm");
    }

    // 2. Day 21 ("BRANNMUR"): Optional Fleet / Varden color-restore hook
    const fleetWebhookUrl = process.env.FLEET_WEBHOOK_URL;
    if (fleetWebhookUrl && day === 21 && normalizedCode === "BRANNMUR") {
      await fetch(fleetWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "nissekomm",
          action: "restore_color",
          grayscale: false,
          reason: "Operasjon Spøkelseskode Dag 21: Brannmur aktivert",
        }),
      }).catch(() => null);
      dispatched.push("fleet_color_restore");
    }

    return NextResponse.json({
      ok: true,
      day,
      code: normalizedCode,
      dispatched,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
