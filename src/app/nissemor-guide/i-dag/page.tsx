"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentDate } from "@/lib/date-utils";

// The installed guide's start_url: «I dag» depends on the client clock
// (time machine override), so the redirect runs in the browser.
export default function IDagSide() {
  const router = useRouter();
  useEffect(() => {
    const d = getCurrentDate();
    const mål =
      d.getMonth() === 10
        ? "/nissemor-guide/forberedelser"
        : `/nissemor-guide/dag/${d.getMonth() === 11 && d.getDate() <= 24 ? d.getDate() : 1}`;
    router.replace(mål);
  }, [router]);
  return null;
}
