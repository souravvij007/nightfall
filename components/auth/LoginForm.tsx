"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";
import { initialLoginState } from "@/app/login/state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      {state.step === "phone" ? (
        <>
          <input type="hidden" name="intent" value="request" />
          <label className="block text-sm text-white/60">Phone number</label>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+919876543210"
            defaultValue={state.phone}
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 font-semibold text-white transition disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send code"}
          </button>
        </>
      ) : (
        <>
          <input type="hidden" name="intent" value="verify" />
          <input type="hidden" name="phone" value={state.phone} />
          <label className="block text-sm text-white/60">
            Enter the 6-digit code sent to <span className="text-white">{state.phone}</span>
          </label>
          <input
            name="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-white/30 outline-none focus:border-fuchsia-400"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 font-semibold text-white transition disabled:opacity-50"
          >
            {pending ? "Verifying…" : "Verify & continue"}
          </button>
          {state.devCode && (
            <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-center text-sm text-amber-300">
              Dev mode — your code is <span className="font-mono font-bold">{state.devCode}</span>
            </p>
          )}
        </>
      )}

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
