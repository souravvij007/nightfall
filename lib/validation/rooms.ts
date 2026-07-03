import { z } from "zod";

export const createRoomSchema = z.object({
  title: z.string().trim().min(1, "Give your room a title.").max(80),
  description: z.string().trim().max(500).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
