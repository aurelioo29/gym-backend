import { z } from "zod";

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    message: "isActive harus boolean",
  }),
});

export const updateRolePermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid("Permission ID tidak valid"))
    .min(1, "Minimal pilih 1 permission"),
});

export const updateGymInfoSchema = z.object({
  name: z.string().min(2, "Nama gym minimal 2 karakter").optional(),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  email: z.string().email("Email tidak valid").nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z
    .string()
    .nullable()
    .optional()
    .refine((value) => {
      if (!value) return true;

      const numberValue = Number(value);

      return (
        !Number.isNaN(numberValue) && numberValue >= -90 && numberValue <= 90
      );
    }, "Latitude harus berada di antara -90 sampai 90"),

  longitude: z
    .string()
    .nullable()
    .optional()
    .refine((value) => {
      if (!value) return true;

      const numberValue = Number(value);

      return (
        !Number.isNaN(numberValue) && numberValue >= -180 && numberValue <= 180
      );
    }, "Longitude harus berada di antara -180 sampai 180"),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  openingHours: z.record(z.string(), z.any()).nullable().optional(),
  instagramUrl: z.string().nullable().optional(),
  facebookUrl: z.string().nullable().optional(),
  tiktokUrl: z.string().nullable().optional(),
  youtubeUrl: z.string().nullable().optional(),
});

export const updateGeneralSettingSchema = z.object({
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), z.any()),
    z.null(),
  ]),
});
