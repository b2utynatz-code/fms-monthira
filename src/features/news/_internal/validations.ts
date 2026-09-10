import { z } from "zod";

export const newsCategoryEnum = z.enum(["ACADEMIC", "ACTIVITY", "RESEARCH", "ANNOUNCEMENT", "PROCUREMENT"]);
export const newsStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createNewsSchema = z.object({
  titleTh: z.string().min(1, "กรุณากรอกหัวข้อภาษาไทย").max(255),
  titleEn: z.string().min(1, "Please enter English title").max(255),
  slug: z.string().max(255).optional(),
  summaryTh: z.string().max(500).optional(),
  summaryEn: z.string().max(500).optional(),
  contentTh: z.string().min(1, "กรุณากรอกเนื้อหาข่าว"),
  contentEn: z.string().optional(),
  category: newsCategoryEnum.default("ANNOUNCEMENT"),
  coverImageUrl: z.string().url().max(500).optional().or(z.literal("")),
  isPinned: z.boolean().default(false),
  pinPriority: z.number().int().default(0),
  status: newsStatusEnum.default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const updateNewsSchema = createNewsSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
