"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPostAction, type PostFormState } from "@/app/feed/actions";

const initial: PostFormState = {};

export function Composer() {
  const [state, formAction, pending] = useActionState(createPostAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <textarea
        name="caption"
        rows={3}
        placeholder="Share something with the club…"
        className="w-full resize-none bg-transparent text-white placeholder-white/30 outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          name="mediaUrl"
          placeholder="Image URL (optional)"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
