"use client";

import { useActionState, useRef, useState } from "react";
import { createChannelAction, type ServerFormState } from "@/app/servers/actions";

const initial: ServerFormState = {};

/** A small "+" popover form for creating a channel of a given type. */
export function AddChannelButton({ serverId, type }: { serverId: string; type: "TEXT" | "VOICE" }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createChannelAction, initial);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <span className="relative">
      <button
        type="button"
        aria-label={`Create ${type === "TEXT" ? "text" : "voice"} channel`}
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => ref.current?.focus(), 0);
        }}
        className="text-base leading-none text-muted transition hover:text-bright"
      >
        ＋
      </button>
      {open && (
        <form
          action={formAction}
          className="absolute right-0 top-6 z-20 w-52 rounded-lg border border-line bg-bg p-2 shadow-xl"
        >
          <input type="hidden" name="serverId" value={serverId} />
          <input type="hidden" name="type" value={type} />
          <input
            ref={ref}
            name="name"
            maxLength={50}
            placeholder={type === "TEXT" ? "new-channel" : "Voice Room"}
            className="w-full rounded border border-line bg-panel px-2 py-1.5 text-sm text-bright placeholder-muted outline-none focus:border-brand-fuchsia"
          />
          {state.error && <p className="mt-1 text-xs text-red-400">{state.error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-xs text-muted hover:text-bright"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? "…" : "Create"}
            </button>
          </div>
        </form>
      )}
    </span>
  );
}
