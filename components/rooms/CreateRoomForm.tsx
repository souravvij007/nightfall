"use client";

import { useActionState } from "react";
import { createRoomAction, type CreateRoomState } from "@/app/rooms/actions";

const initial: CreateRoomState = {};

export function CreateRoomForm({ canHost }: { canHost: boolean }) {
  const [state, formAction, pending] = useActionState(createRoomAction, initial);

  if (!canHost) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
        🔒 Reach <span className="text-white">Level 5</span> to host your own A/V room.
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <input
        name="title"
        placeholder="Room title — e.g. Friday Night Trivia"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
      />
      <input
        name="description"
        placeholder="What's happening? (optional)"
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold text-white transition disabled:opacity-50"
      >
        {pending ? "Starting…" : "Go live"}
      </button>
      {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
