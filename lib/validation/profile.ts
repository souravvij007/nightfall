import { z } from "zod";

/** Public @handle: 3–20 chars, lowercase letters/digits/underscore, must start with a letter. */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z][a-z0-9_]{2,19}$/, "3–20 chars; start with a letter; letters, digits, _ only");

export const displayNameSchema = z.string().trim().min(1).max(50);
export const bioSchema = z.string().trim().max(300);
export const interestsSchema = z.array(z.string().trim().min(1).max(30)).max(15);

/** Fields a user provides when creating their profile after phone verification. */
export const createProfileSchema = z.object({
  handle: handleSchema,
  displayName: displayNameSchema,
  bio: bioSchema.optional(),
  interests: interestsSchema.default([]),
});

/** Partial update — every field optional. */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema.optional(),
  avatarUrl: z.string().url().optional(),
  interests: interestsSchema.optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
