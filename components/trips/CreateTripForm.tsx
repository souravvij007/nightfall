"use client";

import { useActionState } from "react";
import { createTripAction, type TripFormState } from "@/app/trips/actions";

const initial: TripFormState = {};
const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-fuchsia-400";

export function CreateTripForm({ canHost, isStaff }: { canHost: boolean; isStaff: boolean }) {
  const [state, formAction, pending] = useActionState(createTripAction, initial);

  if (!canHost) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/50">
        🔒 Reach <span className="text-white">Level 20</span> to host a trip. Trips need admin approval
        and vendor vetting before going live, and earn you a 70% revenue share.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className={`rounded-lg px-3 py-2 text-xs ${isStaff ? "bg-indigo-500/15 text-indigo-200" : "bg-amber-400/10 text-amber-200"}`}>
        {isStaff
          ? "As staff, this is a Nightfall-official trip (auto-approved, vendors trusted)."
          : "Submitted for admin approval — every vendor you list must be vetted before it goes live."}
      </p>

      <input name="title" placeholder="Title — e.g. Himalayan Weekend Escape" className={input} />
      <textarea name="description" rows={2} placeholder="What's the trip about?" className={`${input} resize-none`} />
      <div className="flex gap-3">
        <input name="destination" placeholder="Destination" className={input} />
        <input name="price" type="number" min={0} defaultValue={0} placeholder="Price (₹)" className={`${input} w-32`} />
        <input name="capacity" type="number" min={1} defaultValue={12} placeholder="Capacity" className={`${input} w-28`} />
      </div>
      <div className="flex gap-3">
        <label className="flex-1 text-xs text-white/40">Starts<input name="startsAt" type="datetime-local" className={`${input} mt-1`} /></label>
        <label className="flex-1 text-xs text-white/40">Ends<input name="endsAt" type="datetime-local" className={`${input} mt-1`} /></label>
      </div>

      <label className="block text-xs text-white/40">
        Itinerary — one day per line: <code>Title | Description</code>
        <textarea name="itinerary" rows={3} placeholder={"Arrival & sunset trek | Reach base camp, evening bonfire\nSummit day | Early hike to the peak"} className={`${input} mt-1 resize-none font-mono text-xs`} />
      </label>
      <label className="block text-xs text-white/40">
        Accommodations — one per line: <code>Name | nights | details</code>
        <textarea name="accommodations" rows={2} placeholder={"Cedar Lodge | 2 | mountain-view rooms"} className={`${input} mt-1 resize-none font-mono text-xs`} />
      </label>
      <label className="block text-xs text-white/40">
        Vendors — one per line: <code>KIND | Name | contact</code> (HOTEL/TRANSPORT/ACTIVITY/OTHER)
        <textarea name="vendors" rows={2} placeholder={"HOTEL | Cedar Lodge | +91...\nTRANSPORT | Hill Cabs | +91..."} className={`${input} mt-1 resize-none font-mono text-xs`} />
      </label>

      <button type="submit" disabled={pending} className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold text-white transition disabled:opacity-50">
        {pending ? "Submitting…" : isStaff ? "Publish trip" : "Submit for approval"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
