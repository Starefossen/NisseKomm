"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { morgendagen } from "../_kveld/felles";

// Old URL kept so bookmarks still work. Client-side: «tomorrow» follows the
// time machine's localStorage override, which the server cannot see.
export default function IKveldSide() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/nissemor-guide/dag/${morgendagen() ?? 1}#kveld`);
  }, [router]);
  return null;
}
