import { z } from "zod";

export const createTripScalarSchema = z
  .object({
    title: z.string().trim().min(1, "Add a title.").max(120),
    description: z.string().trim().min(1, "Describe the trip.").max(4000),
    destination: z.string().trim().min(1, "Where to?").max(120),
    startsAt: z.coerce.date({ message: "Pick a start date." }),
    endsAt: z.coerce.date({ message: "Pick an end date." }),
    price: z.coerce.number().min(0).max(1000000),
    capacity: z.coerce.number().int().min(1).max(500),
  })
  .refine((v) => v.startsAt.getTime() > Date.now(), { message: "Start must be in the future.", path: ["startsAt"] })
  .refine((v) => v.endsAt.getTime() > v.startsAt.getTime(), { message: "End must be after start.", path: ["endsAt"] });

const VENDOR_KINDS = new Set(["HOTEL", "TRANSPORT", "ACTIVITY", "OTHER"]);

/** Parse "Title | Description" lines into itinerary days. */
export function parseItinerary(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [title, ...rest] = line.split("|");
      return { dayNumber: i + 1, title: (title ?? "").trim() || `Day ${i + 1}`, description: rest.join("|").trim() };
    });
}

/** Parse "Name | nights | details" lines into accommodations. */
export function parseAccommodations(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, nights, ...details] = line.split("|").map((s) => s.trim());
      return { name: name || "Accommodation", nights: Math.max(1, Number(nights) || 1), details: details.join("|") || undefined };
    });
}

/** Parse "KIND | Name | contact" lines into vendors. */
export function parseVendors(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [kindRaw, name, contact] = line.split("|").map((s) => s.trim());
      const kind = (kindRaw ?? "").toUpperCase();
      return {
        kind: (VENDOR_KINDS.has(kind) ? kind : "OTHER") as "HOTEL" | "TRANSPORT" | "ACTIVITY" | "OTHER",
        name: name || kindRaw || "Vendor",
        contact: contact || undefined,
      };
    });
}
