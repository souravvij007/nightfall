"use client";

import { useEffect, useState } from "react";

type Status =
  | { state: "loading" }
  | { state: "ready"; url: string }
  | { state: "unconfigured"; hint: string }
  | { state: "error"; message: string };

/**
 * Acquires a LiveKit token for the room and reports A/V readiness. Rendering actual audio/video
 * tracks needs `@livekit/components-react` + a running LiveKit server; this shows that the token
 * pipeline is wired and will connect once keys are present.
 */
export function LiveKitStage({ roomId }: { roomId: string }) {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.configured) setStatus({ state: "ready", url: data.url });
        else if (res.status === 501) setStatus({ state: "unconfigured", hint: data.hint ?? "" });
        else setStatus({ state: "error", message: data.error ?? `HTTP ${res.status}` });
      } catch (e) {
        if (!cancelled) setStatus({ state: "error", message: String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
      {status.state === "loading" && <p className="text-white/40">Connecting to A/V…</p>}
      {status.state === "ready" && (
        <>
          <div className="text-3xl">🎙️</div>
          <p className="mt-2 font-semibold text-emerald-300">A/V ready</p>
          <p className="mt-1 text-xs text-white/40">Token acquired · {status.url}</p>
        </>
      )}
      {status.state === "unconfigured" && (
        <>
          <div className="text-3xl">🎧</div>
          <p className="mt-2 font-semibold text-amber-300">A/V provider not configured</p>
          <p className="mt-1 text-xs text-white/40">{status.hint}</p>
        </>
      )}
      {status.state === "error" && <p className="text-red-400">A/V error: {status.message}</p>}
    </div>
  );
}
