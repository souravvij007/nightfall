"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Serverless-friendly "realtime": polls a lightweight version endpoint (/api/poll) on an interval
 * and refreshes the route's server components only when the version changes. No long-lived
 * connections, so it works on Vercel serverless and fans out correctly across instances (the DB is
 * the shared source of truth). Polling pauses while the tab is hidden to save requests.
 *
 * `topic` selects what to watch ("dm", "room"); pass `id` for a specific thread/room, or omit it
 * (e.g. on an inbox) to watch across all of them.
 */
export function RealtimeRefresh({
  topic,
  id,
  intervalMs = 4000,
}: {
  topic: string;
  id?: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const lastVersion = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const url = `/api/poll?topic=${encodeURIComponent(topic)}${id ? `&id=${encodeURIComponent(id)}` : ""}`;

    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const { version } = (await res.json()) as { version: string };
            if (lastVersion.current === null) {
              lastVersion.current = version;
            } else if (version !== lastVersion.current) {
              lastVersion.current = version;
              router.refresh();
            }
          }
        } catch {
          // transient network error — try again next tick
        }
      }
      if (active) timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router, topic, id, intervalMs]);

  return null;
}
