import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().trim().min(2, "Server name is too short.").max(50, "Server name is too long."),
});

export const channelTypeSchema = z.enum(["TEXT", "VOICE"]);

export const createChannelSchema = z.object({
  name: z.string().trim().min(1, "Channel needs a name.").max(50, "Channel name is too long."),
  type: channelTypeSchema.default("TEXT"),
});

export type CreateServerInput = z.infer<typeof createServerSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
