import { z } from "zod";

export const postTypeSchema = z.enum(["TEXT", "PHOTO", "REEL"]);

export const createPostSchema = z
  .object({
    type: postTypeSchema.default("TEXT"),
    caption: z.string().trim().max(2000).optional(),
    mediaUrl: z.string().trim().url().optional(),
  })
  .refine((v) => (v.caption && v.caption.length > 0) || v.mediaUrl, {
    message: "Add a caption or media.",
    path: ["caption"],
  });

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Say something.").max(1000),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const reportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER"]),
  targetId: z.string().min(1),
  reason: z.enum(["SPAM", "HARASSMENT", "NUDITY", "HATE", "OTHER"]),
  detail: z.string().trim().max(1000).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
