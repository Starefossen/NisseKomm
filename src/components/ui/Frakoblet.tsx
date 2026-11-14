"use client";

import { useSyncExternalStore } from "react";
import { getSyncStatus, SYNC_EVENT } from "@/lib/storage-adapter";

const subscribe = (cb: () => void) => {
  window.addEventListener(SYNC_EVENT, cb);
  return () => window.removeEventListener(SYNC_EVENT, cb);
};

/** Quiet corner note while the sync retries; the kids keep playing. */
export function Frakoblet() {
  const status = useSyncExternalStore(subscribe, getSyncStatus, () => "ok");
  if (status !== "frakoblet") return null;
  return (
    <div
      role="status"
      className="fixed bottom-2 left-2 z-50 px-2 py-1 font-retro text-sm text-(--cold-blue) border border-(--cold-blue)/50 bg-black/70 pointer-events-none animate-pulse"
    >
      Frakoblet – prøver igjen
    </div>
  );
}
