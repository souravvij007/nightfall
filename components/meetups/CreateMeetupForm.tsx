"use client";

import { useActionState } from "react";
import { createMeetupAction, type MeetupFormState } from "@/app/meetups/actions";

const initial: MeetupFormState = {};
const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-fuchsia-400";

export function CreateMeetupForm({ canHost, isStaff }: { canHost: boolean; isStaff: boolean }) {
  const [state, formAction, pending] = useActionState(createMeetupAction, initial);

  if (!canHost) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/50">
        🔒 Reach <span className="text-white">Level 10</span> to host your own meetup. Hosted meetups
        go live after admin approval and earn you a 70% revenue share.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      {isStaff ? (
        <p className="rounded-lg bg-indigo-500/15 px-3 py-2 text-xs text-indigo-200">
          As staff, this is created as a <b>Nightfall-official</b> meetup (auto-approved).
        </p>
      ) : (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Your meetup is submitted for admin approval before it goes live (70/30 revenue share).
        </p>
      )}

      <input name="title" placeholder="Title — e.g. Sunset rooftop mixer" className={input} />
      <textarea name="description" rows={3} placeholder="What's the plan?" className={`${input} resize-none`} />
      <div className="flex gap-3">
        <input name="city" placeholder="City" className={input} />
        <input name="venue" placeholder="Venue (optional)" className={input} />
      </div>
      <div className="flex gap-3">
        <label className="flex-1 text-xs text-white/40">
          Date &amp; time
          <input name="startsAt" type="datetime-local" className={`${input} mt-1`} />
        </label>
        <label className="w-28 text-xs text-white/40">
          Fee (₹)
          <input name="fee" type="number" min={0} defaultValue={0} className={`${input} mt-1`} />
        </label>
        <label className="w-28 text-xs text-white/40">
          Capacity
          <input name="capacity" type="number" min={1} defaultValue={20} className={`${input} mt-1`} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold text-white transition disabled:opacity-50"
      >
        {pending ? "Submitting…" : isStaff ? "Publish meetup" : "Submit for approval"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
