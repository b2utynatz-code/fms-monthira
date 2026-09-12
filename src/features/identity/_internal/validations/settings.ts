import { z } from "zod";
import { PALETTE_IDS } from "@/shared/lib/palette";

export const smtpSettingsSchema = z
  .object({
    enabled: z.boolean().default(false),
    service: z.enum(["gmail", "custom"]).default("gmail"),
    host: z.string().trim().default("smtp.gmail.com"),
    port: z.coerce.number().int().min(1).max(65535).default(587),
    secure: z.boolean().default(false),
    user: z.string().trim().default(""),
    pass: z.string().trim().default(""),
    fromName: z.string().trim().max(255).default(""),
    fromEmail: z.string().trim().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.enabled) {
      if (!data.user || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.user)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกอีเมล Gmail ให้ถูกต้อง",
          path: ["user"],
        });
      }
      if (!data.host) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอก SMTP Host",
          path: ["host"],
        });
      }
    }
  });

export const testSmtpSchema = z.object({
  toEmail: z.string().trim().email("กรุณากรอกอีเมลผู้รับให้ถูกต้อง"),
  smtp: z.object({
    host: z.string().trim().min(1, "กรุณากรอก SMTP Host").default("smtp.gmail.com"),
    port: z.coerce.number().int().min(1).max(65535).default(587),
    secure: z.boolean().default(false),
    user: z.string().trim().email("กรุณากรอกอีเมล Gmail ให้ถูกต้อง"),
    pass: z.string().trim().optional().default(""),
    fromName: z.string().trim().optional().default(""),
    fromEmail: z.string().trim().optional().default(""),
  }),
});

export const contactSettingsSchema = z.object({
  phone: z.string().trim().max(100).default(""),
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(255).optional().or(z.literal("")).default(""),
  addressTh: z.string().trim().max(500).default(""),
  addressEn: z.string().trim().max(500).default(""),
  hoursTh: z.string().trim().max(200).default(""),
  hoursEn: z.string().trim().max(200).default(""),
  facebook: z.string().trim().max(255).default(""),
  line: z.string().trim().max(100).default(""),
  website: z.string().trim().max(255).default(""),
});

export const geminiSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().trim().default(""),
  model: z.string().trim().default("gemini-2.5-flash"),
});

export const testGeminiSchema = z.object({
  apiKey: z.string().trim().min(1, "กรุณากรอก Gemini API Key"),
  model: z.string().trim().default("gemini-2.5-flash"),
});

export const orgStatementSchema = z.object({
  sloganTh: z.string().trim().max(500).default(""),
  sloganEn: z.string().trim().max(500).default(""),
  visionTh: z.string().trim().max(2000).default(""),
  visionEn: z.string().trim().max(2000).default(""),
  missionTh: z.string().trim().max(3000).default(""),
  missionEn: z.string().trim().max(3000).default(""),
  valuesTh: z.string().trim().max(2000).default(""),
  valuesEn: z.string().trim().max(2000).default(""),
});

export const updateSettingsSchema = z.object({
  nameTh: z.string().trim().min(1).max(255),
  nameEn: z.string().trim().min(1).max(255),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (val) => val === "" || val.startsWith("/") || /^https?:\/\//i.test(val),
      { message: "URL ไม่ถูกต้อง" }
    )
    .default(""),
  palette: z.enum(PALETTE_IDS),
  smtp: smtpSettingsSchema.optional(),
  contact: contactSettingsSchema.optional(),
  gemini: geminiSettingsSchema.optional(),
  statement: orgStatementSchema.optional(),
});
export const updateProfileSchema = z.object({ name: z.string().trim().min(1).max(255), locale: z.enum(["th", "en"]) });
export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;
export type TestSmtpInput = z.infer<typeof testSmtpSchema>;
export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
export type GeminiSettingsInput = z.infer<typeof geminiSettingsSchema>;
export type TestGeminiInput = z.infer<typeof testGeminiSchema>;
export type OrgStatementInput = z.infer<typeof orgStatementSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

