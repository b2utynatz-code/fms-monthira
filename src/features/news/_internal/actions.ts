"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission, getTenantRawGemini } from "@/features/identity/server";
import { NEWS_P } from "../permissions";
import { createNewsSchema, updateNewsSchema } from "./validations";
import { createNews, updateNews, deleteNews, listNews, type NewsArticleDto } from "./services";
import { translateNewsWithGemini, type TranslateNewsResult } from "./services/gemini.service";
import { z } from "zod";
import { AppError } from "@/shared/lib/errors";

export async function getNewsListAction(options?: { status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; category?: string }): Promise<ActionResult<NewsArticleDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsRead);
    return listNews(ctx.tenantId, options);
  });
}

export async function createNewsAction(input: unknown): Promise<ActionResult<NewsArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    const parsed = createNewsSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createNews(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/news");
    return result;
  });
}

export async function updateNewsAction(input: unknown): Promise<ActionResult<NewsArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    const parsed = updateNewsSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateNews(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/news");
    return result;
  });
}

export async function deleteNewsAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    await deleteNews(ctx.tenantId, ctx.userId, id);
    revalidatePath("/news");
  });
}

const translateNewsInputSchema = z.object({
  titleTh: z.string().trim().min(1, "กรุณากรอกหัวข้อข่าวภาษาไทย"),
  summaryTh: z.string().trim().optional(),
  contentTh: z.string().trim().min(1, "กรุณากรอกเนื้อหาข่าวภาษาไทย"),
});

export async function translateNewsWithGeminiAction(input: unknown): Promise<ActionResult<TranslateNewsResult>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    const parsed = translateNewsInputSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const gemini = await getTenantRawGemini(ctx.tenantId);

    if (!gemini?.apiKey) {
      throw new AppError("validation", "ยังไม่ได้ตั้งค่า Google Gemini API Key กรุณาไปที่เมนู 'ตั้งค่าองค์กร' เพื่อระบุ API Key");
    }

    return translateNewsWithGemini({
      apiKey: gemini.apiKey,
      model: gemini.model,
      titleTh: parsed.titleTh,
      summaryTh: parsed.summaryTh,
      contentTh: parsed.contentTh,
    });
  });
}


