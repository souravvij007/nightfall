"use client";

import { useState } from "react";
import { createInviteAction } from "@/app/servers/actions";

/** Creates an invite code on click and shows a copyable join link. */
export function InviteButton({ serverId }: { serverId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function invite() {
    setPending(true);
    const res = await createInviteAction(serverId);
    setPending(false);
    if (res.code) setUrl(`${window.location.origin}/servers/join/${res.code}`);
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the link is visible to copy manually */
    }
  }

  if (url) {
    return (
      <button
        onClick={copy}
        title={url}
        className="max-w-[220px] truncate rounded bg-hover px-2 py-1 text-xs text-muted transition hover:text-bright"
      >
        {copied ? "Copied ✓" : url}
      </button>
    );
  }

  return (
    <button
      onClick={invite}
      disabled={pending}
      className="rounded bg-hover px-3 py-1 text-xs font-semibold text-muted transition hover:text-bright disabled:opacity-50"
    >
      {pending ? "…" : "Invite"}
    </button>
  );
}
