"use client";

import { useActionState } from "react";
import { createServerAction, type ServerFormState } from "@/app/servers/actions";

const initial: ServerFormState = {};

export function CreateServerForm() {
  const [state, formAction, pending] = useActionState(createServerAction, initial);

  return (
    <form action={formAction} className="w-full max-w-sm">
      <label htmlFor="server-name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
        Server name
      </label>
      <input
        id="server-name"
        name="name"
        maxLength={50}
        autoFocus
        placeholder="e.g. Late Night Coders"
        className="w-full rounded-lg border border-line bg-panel px-4 py-3 text-bright placeholder-muted outline-none focus:border-brand-fuchsia"
      />
      {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-brand-indigo to-brand-fuchsia px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Server"}
      </button>
    </form>
  );
}
