"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Shown inside GuideAuth: once the parent is logged in, render the printout on the server. */
export function Oppfrisk() {
  const router = useRouter();
  useEffect(() => router.refresh(), [router]);
  return <p className="p-8">Laster ...</p>;
}
