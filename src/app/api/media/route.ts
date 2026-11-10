import { isLanMode, mediaStatus } from "@/lib/media-server";

// TODO(T4): require the parent session here once T4 is merged.
export async function GET() {
  if (!isLanMode()) return new Response("Ikke funnet", { status: 404 });
  return Response.json(await mediaStatus());
}
