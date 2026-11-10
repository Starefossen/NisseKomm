import type { NextRequest } from "next/server";
import { authorizeMedia, tooLarge, uploadMedia } from "@/lib/media-server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const parts = (await params).path;
  if (tooLarge(req.headers.get("content-length"))) {
    return new Response("Feil størrelse", { status: 413 });
  }
  return (
    (await authorizeMedia(req, parts.join("/").normalize("NFC"))) ??
    uploadMedia(parts, req.headers.get("content-type"), await req.arrayBuffer())
  );
}
