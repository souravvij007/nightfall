import { z } from "zod";

/** E.164 phone number, e.g. +919876543210. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number in international format");

/** Request an OTP for a phone number. */
export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

/** Verify a phone number with the 6-digit OTP. */
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
