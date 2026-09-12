import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Eye, Tag } from "lucide-react";
import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();

  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
  const tenantId = tenant?.id || "";

  const news = await prisma.newsArticle.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });

  if (!news || news.status !== "PUBLISHED") {
    notFound();
  }

  // Increment view
  await prisma.newsArticle.update({
    where: { id: news.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2 mb-6">
          <Link href="/portal/news">
            <ArrowLeft className="h-4 w-4" />
            <span>{locale === "en" ? "Back to News" : "ย้อนกลับไปหน้าข่าว"}</span>
          </Link>
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
            <Tag className="h-3 w-3" />
            {news.category}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {news.publishedAt ? formatDate(news.publishedAt, locale) : "—"}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {news.viewCount + 1} {locale === "en" ? "views" : "ครั้ง"}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {locale === "en" ? news.titleEn : news.titleTh}
        </h1>

        {(news.summaryTh || news.summaryEn) && (
          <p className="text-base text-muted-foreground mt-4 leading-relaxed border-l-4 border-primary pl-4 py-1 italic">
            {locale === "en" ? news.summaryEn || news.summaryTh : news.summaryTh}
          </p>
        )}
      </div>

      {news.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden border max-h-96 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={news.coverImageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article Content */}
      {/<[a-z][\s\S]*>/i.test(locale === "en" ? news.contentEn || news.contentTh : news.contentTh) ? (
        <div
          className="prose dark:prose-invert max-w-none text-base leading-relaxed py-4 border-b [&_img]:rounded-xl [&_img]:max-h-[500px] [&_img]:mx-auto [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:pl-4"
          dangerouslySetInnerHTML={{
            __html: locale === "en" ? news.contentEn || news.contentTh : news.contentTh,
          }}
        />
      ) : (
        <div className="prose dark:prose-invert max-w-none text-base leading-relaxed whitespace-pre-line py-4 border-b">
          {locale === "en" ? news.contentEn || news.contentTh : news.contentTh}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-muted-foreground">
          {locale === "en" ? "Published by Faculty PR Team" : "เผยแพร่โดย งานสื่อสารองค์กรและประชาสัมพันธ์ คณะวิทยาการจัดการ"}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/portal/news">
            <span>{locale === "en" ? "Read Other Articles" : "อ่านข่าวอื่น ๆ"}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
