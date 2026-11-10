/** GET /api/varsler  Parent only: { channels } enabled by NOTIFY_CHANNELS. */
import { NextRequest, NextResponse } from "next/server";
import { getRole, jsonError } from "@/lib/auth";
import { enabledChannels } from "@/lib/notify";

export async function GET(request: NextRequest) {
  if ((await getRole(request)) !== "parent") {
    return jsonError("Ikke innlogget", 401);
  }
  return NextResponse.json({ channels: enabledChannels() });
}
