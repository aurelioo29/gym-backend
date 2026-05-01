import { z } from "zod";

const phoneRegex = /^[0-9+\-\s()]{8,20}$/;

export const registerCustomerSchema = z.object({
  fullName: z.string().min(2, "Full name minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().regex(phoneRegex, "Nomor phone tidak valid").optional(),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const registerTrainerSchema = z.object({
  fullName: z.string().min(2, "Full name minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().regex(phoneRegex, "Nomor phone tidak valid").optional(),
  password: z.string().min(8, "Password minimal 8 karakter"),

  specialization: z.string().optional(),
  certification: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0).optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Email tidak valid"),
  code: z
    .string()
    .min(4, "Kode OTP tidak valid")
    .max(10, "Kode OTP tidak valid"),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const mobileLoginSchema = z.object({
  identifier: z.string().min(1, "Email atau phone wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});
