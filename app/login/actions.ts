"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import { requestOtpSchema, verifyOtpSchema } from "@/lib/validation/auth";
import { requestOtp, verifyOtp } from "@/lib/auth/otp";
import { createSession, setPendingPhone } from "@/lib/auth/session";
import type { LoginState } from "./state";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");

  if (intent === "request") {
    const parsed = requestOtpSchema.safeParse({ phone: formData.get("phone") });
    if (!parsed.success) {
      return { step: "phone", phone: String(formData.get("phone") ?? ""), error: "Enter a valid phone number in international format, e.g. +919876543210." };
    }
    const { devCode } = await requestOtp(parsed.data.phone);
    return { step: "code", phone: parsed.data.phone, devCode };
  }

  // intent === "verify"
  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { step: "code", phone: String(formData.get("phone") ?? ""), error: "Enter the 6-digit code." };
  }

  const result = await verifyOtp(parsed.data.phone, parsed.data.code);
  if (!result.ok) {
    const messages = {
      expired: "That code has expired. Request a new one.",
      invalid: "Incorrect code. Try again.",
      too_many_attempts: "Too many attempts. Request a new code.",
    } as const;
    return { step: "code", phone: parsed.data.phone, error: messages[result.reason] };
  }

  const user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
  if (user) {
    const ua = (await headers()).get("user-agent") ?? undefined;
    await createSession(user.id, { userAgent: ua });
    redirect("/me");
  }

  // New number → collect a profile before creating the account.
  await setPendingPhone(parsed.data.phone);
  redirect("/onboarding");
}
