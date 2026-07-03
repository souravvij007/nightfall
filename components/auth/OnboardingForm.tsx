"use client";

import { useActionState } from "react";
import { createProfileAction, type OnboardingState } from "@/app/onboarding/actions";

const initial: OnboardingState = {};

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createProfileAction, initial);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm text-white/60">Handle</label>
        <div className="mt-1 flex items-center rounded-lg border border-white/15 bg-white/5 px-3 focus-within:border-fuchsia-400">
          <span className="text-white/40">@</span>
          <input
            name="handle"
            defaultValue={state.values?.handle}
            placeholder="nightowl"
            autoFocus
            className="w-full bg-transparent px-1 py-3 text-white placeholder-white/30 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-white/60">Display name</label>
        <input
          name="displayName"
          defaultValue={state.values?.displayName}
          placeholder="Night Owl"
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
        />
      </div>
      <div>
        <label className="block text-sm text-white/60">Bio (optional)</label>
        <textarea
          name="bio"
          defaultValue={state.values?.bio}
          rows={3}
          placeholder="Here for the strangers and the stories."
          className="mt-1 w-full resize-none rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 font-semibold text-white transition disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create profile"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
