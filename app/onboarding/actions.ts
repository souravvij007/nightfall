"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import { createProfileSchema } from "@/lib/validation/profile";
import { getPendingPhone, clearPendingPhone, createSession } from "@/lib/auth/session";

export interface OnboardingState {
  error?: string;
  values?: { handle: string; displayName: string; bio: string };
}

export async function createProfileAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const phone = await getPendingPhone();
  if (!phone) redirect("/login");

  const raw = {
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
    interests: [],
  };
  const values = {
    handle: String(formData.get("handle") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  };

  const parsed = createProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details.", values };
  }

  // Handle must be unique.
  const taken = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
  if (taken) return { error: `@${parsed.data.handle} is taken — pick another.`, values };

  const user = await prisma.user.create({
    data: {
      phone,
      handle: parsed.data.handle,
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      interests: parsed.data.interests,
    },
  });

  await clearPendingPhone();
  const ua = (await headers()).get("user-agent") ?? undefined;
  await createSession(user.id, { userAgent: ua });
  redirect("/me");
}
