"use client";

import { useRef, useState } from "react";
import { sendChannelMessageAction } from "@/app/servers/actions";

/** Message composer for a text channel: Enter to send, clears on success. */
export function ChannelComposer({
  serverId,
  channelId,
  channelName,
}: {
  serverId: string;
  channelId: string;
  channelName: string;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(formData: FormData) {
    const value = String(formData.get("body") ?? "").trim();
    if (!value) return;
    setPending(true);
    setBody("");
    await sendChannelMessageAction(formData);
    setPending(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (body.trim()) formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={submit} className="px-4 pb-5 pt-1">
      <input type="hidden" name="serverId" value={serverId} />
      <input type="hidden" name="channelId" value={channelId} />
      <div className="flex items-end gap-2 rounded-lg bg-[#383a40] px-4 py-2.5">
        <textarea
          name="body"
          rows={1}
          value={body}
          maxLength={2000}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Message #${channelName}`}
          className="max-h-40 flex-1 resize-none bg-transparent text-bright placeholder-muted outline-none"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="shrink-0 rounded bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-3 py-1.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </form>
  );
}
