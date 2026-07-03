import { z } from "zod";

export const createMeetupSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(120),
  description: z.string().trim().min(1, "Describe your meetup.").max(2000),
  city: z.string().trim().min(1, "Which city?").max(80),
  venue: z.string().trim().max(120).optional(),
  startsAt: z.coerce
    .date({ message: "Pick a date & time." })
    .refine((d) => d.getTime() > Date.now(), "Must be in the future."),
  // Entry fee in major currency units (e.g. rupees); 0 = free.
  fee: z.coerce.number().min(0, "Fee can't be negative.").max(100000),
  capacity: z.coerce.number().int().min(1, "At least 1 spot.").max(1000),
});

export type CreateMeetupInput = z.infer<typeof createMeetupSchema>;
