import type { NextRequest } from "next/server";
import { authorizeMedia, uploadMedia } from "@/lib/media-server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const parts = (await params).path;
  return (
    (await authorizeMedia(req, parts.join("/").normalize("NFC"))) ??
    uploadMedia(parts, req.headers.get("content-type"), await req.arrayBuffer())
  );
}
