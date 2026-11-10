import { serveMedia } from "@/lib/media-server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return serveMedia((await params).path, req.headers.get("range"));
}
