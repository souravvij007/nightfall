import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { User } from "@/lib/generated/prisma/client";

export function isStaff(user: Pick<User, "role">): boolean {
  return user.role === "ADMIN" || user.role === "MODERATOR";
}

/** Require an authenticated staff member. Redirects otherwise. */
export async function requireStaff(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isStaff(user)) redirect("/feed");
  return user;
}
