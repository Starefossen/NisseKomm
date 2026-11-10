import { extraMusic } from "@/lib/media-server";

/** Uploaded NisseMusikk tracks beyond the built-in playlist (kid-visible). */
export async function GET() {
  return Response.json((await extraMusic()).map((f) => f.path));
}
