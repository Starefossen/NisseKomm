import { permanentRedirect } from "next/navigation";

// Old URL kept so bookmarks still work: /fasit?dag=7 → /dag/7#fasit.
export default async function Side({
  searchParams,
}: {
  searchParams: Promise<{ dag?: string }>;
}) {
  const dag = Number((await searchParams).dag);
  permanentRedirect(
    dag >= 1 && dag <= 24
      ? `/nissemor-guide/dag/${dag}#fasit`
      : "/nissemor-guide/dag",
  );
}
