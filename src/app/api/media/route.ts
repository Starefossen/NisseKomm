import type { NextRequest } from "next/server";
import { authorizeMedia, mediaStatus } from "@/lib/media-server";

export async function GET(req: NextRequest) {
  return (await authorizeMedia(req)) ?? Response.json(await mediaStatus());
}
