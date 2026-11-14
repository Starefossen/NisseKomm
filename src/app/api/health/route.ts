import { dbOk } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await dbOk()) return Response.json({ status: "ok" });
  return Response.json({ status: "db-unavailable" }, { status: 503 });
}
