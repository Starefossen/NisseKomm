import { uploadMedia } from "@/lib/media-server";

// TODO(T4): require the parent session here once T4 is merged.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return uploadMedia(
    (await params).path,
    req.headers.get("content-type"),
    await req.arrayBuffer(),
  );
}
