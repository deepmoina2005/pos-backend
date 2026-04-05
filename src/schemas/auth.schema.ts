import { z } from "zod";
import { UserRole } from "../generated/client/index.js";

const normalizedEmailSchema = z.string().trim().toLowerCase().email();
const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const signupSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().trim().min(6),
  fullName: z.string().trim().min(2),
  role: z.nativeEnum(UserRole),
  phoneNumber: optionalPhoneSchema,
});

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().trim().min(1),
});

export const forgotPasswordSchema = z.object({
  email: normalizedEmailSchema,
  origin: z.string().url().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export const emailOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const verifyResetTokenSchema = z.object({
  token: z.string().length(6),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EmailOtpInput = z.infer<typeof emailOtpSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>;
