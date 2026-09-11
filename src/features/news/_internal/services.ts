import { prisma } from "@/shared/lib/infra/prisma";
import type { NewsCategory, NewsStatus } from "@/generated/prisma";
import type { CreateNewsInput, UpdateNewsInput } from "./validations";

export interface NewsArticleDto {
  id: string;
  tenantId: string;
  titleTh: string;
  titleEn: string;
  slug: string;
  summaryTh: string | null;
  summaryEn: string | null;
  contentTh: string;
  contentEn: string | null;
  category: NewsCategory;
  coverImageUrl: string | null;
  isPinned: boolean;
  pinPriority: number;
  status: NewsStatus;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "news"}-${Date.now().toString(36)}`;
}


export async function listNews(tenantId: string, options?: { status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; category?: string; limit?: number }): Promise<NewsArticleDto[]> {
  const items = await prisma.newsArticle.findMany({
    where: {
      tenantId,
      ...(options?.status ? { status: options.status as NewsStatus } : {}),
      ...(options?.category ? { category: options.category as NewsCategory } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { pinPriority: "desc" }, { createdAt: "desc" }],
    take: options?.limit,
  });

  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    titleTh: item.titleTh,
    titleEn: item.titleEn,
    slug: item.slug,
    summaryTh: item.summaryTh,
    summaryEn: item.summaryEn,
    contentTh: item.contentTh,
    contentEn: item.contentEn,
    category: item.category,
    coverImageUrl: item.coverImageUrl,
    isPinned: item.isPinned,
    pinPriority: item.pinPriority,
    status: item.status,
    viewCount: item.viewCount,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function getNewsBySlug(tenantId: string, slug: string): Promise<NewsArticleDto | null> {
  const item = await prisma.newsArticle.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (!item) return null;

  // Increment view count
  await prisma.newsArticle.update({
    where: { id: item.id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    id: item.id,
    tenantId: item.tenantId,
    titleTh: item.titleTh,
    titleEn: item.titleEn,
    slug: item.slug,
    summaryTh: item.summaryTh,
    summaryEn: item.summaryEn,
    contentTh: item.contentTh,
    contentEn: item.contentEn,
    category: item.category,
    coverImageUrl: item.coverImageUrl,
    isPinned: item.isPinned,
    pinPriority: item.pinPriority,
    status: item.status,
    viewCount: item.viewCount + 1,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function createNews(tenantId: string, authorId: string, input: CreateNewsInput): Promise<NewsArticleDto> {
  const slug = input.slug?.trim() || generateSlug(input.titleEn || input.titleTh);

  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.newsArticle.create({
      data: {
        tenantId,
        authorId,
        titleTh: input.titleTh,
        titleEn: input.titleEn,
        slug,
        summaryTh: input.summaryTh ?? null,
        summaryEn: input.summaryEn ?? null,
        contentTh: input.contentTh,
        contentEn: input.contentEn ?? null,
        category: input.category,
        coverImageUrl: input.coverImageUrl || null,
        isPinned: input.isPinned,
        pinPriority: input.pinPriority,
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? (input.publishedAt ? new Date(input.publishedAt) : new Date()) : null,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: authorId,
        action: "news.create",
        entity: "news_article",
        entityId: item.id,
        after: { titleTh: item.titleTh, slug: item.slug, status: item.status },
      },
    });

    return item;
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    titleTh: created.titleTh,
    titleEn: created.titleEn,
    slug: created.slug,
    summaryTh: created.summaryTh,
    summaryEn: created.summaryEn,
    contentTh: created.contentTh,
    contentEn: created.contentEn,
    category: created.category,
    coverImageUrl: created.coverImageUrl,
    isPinned: created.isPinned,
    pinPriority: created.pinPriority,
    status: created.status,
    viewCount: created.viewCount,
    publishedAt: created.publishedAt ? created.publishedAt.toISOString() : null,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateNews(tenantId: string, actorId: string, input: UpdateNewsInput): Promise<NewsArticleDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.newsArticle.update({
      where: { id: input.id, tenantId },
      data: {
        titleTh: input.titleTh,
        titleEn: input.titleEn,
        summaryTh: input.summaryTh,
        summaryEn: input.summaryEn,
        contentTh: input.contentTh,
        contentEn: input.contentEn,
        category: input.category,
        coverImageUrl: input.coverImageUrl || null,
        isPinned: input.isPinned,
        pinPriority: input.pinPriority,
        status: input.status,
        publishedAt: input.publishedAt !== undefined ? (input.publishedAt ? new Date(input.publishedAt) : null) : undefined,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "news.update",
        entity: "news_article",
        entityId: item.id,
        after: { titleTh: item.titleTh, status: item.status },
      },
    });

    return item;
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    titleTh: updated.titleTh,
    titleEn: updated.titleEn,
    slug: updated.slug,
    summaryTh: updated.summaryTh,
    summaryEn: updated.summaryEn,
    contentTh: updated.contentTh,
    contentEn: updated.contentEn,
    category: updated.category,
    coverImageUrl: updated.coverImageUrl,
    isPinned: updated.isPinned,
    pinPriority: updated.pinPriority,
    status: updated.status,
    viewCount: updated.viewCount,
    publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteNews(tenantId: string, actorId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.newsArticle.findUnique({
      where: { id, tenantId },
      select: { titleTh: true, slug: true },
    });

    await tx.newsArticle.delete({
      where: { id, tenantId },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "news.delete",
        entity: "news_article",
        entityId: id,
        before: existing ? { titleTh: existing.titleTh, slug: existing.slug } : undefined,
      },
    });
  });
}

