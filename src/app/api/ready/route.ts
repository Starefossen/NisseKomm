import { dbOk } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Monitoring only, not a probe: 503 while Postgres is unreachable. */
export async function GET() {
  if (await dbOk()) return Response.json({ status: "ok" });
  return Response.json({ status: "db-unavailable" }, { status: 503 });
}
