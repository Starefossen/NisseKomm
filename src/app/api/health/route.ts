export const dynamic = "force-dynamic";

// Liveness only: the app plays on from the client cache when Postgres is down.
// DB status for monitoring is /api/ready.
export function GET() {
  return Response.json({ status: "ok" });
}
