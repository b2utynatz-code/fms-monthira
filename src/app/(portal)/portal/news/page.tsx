import Link from "next/link";
import { Newspaper, ArrowRight, Calendar, Eye } from "lucide-react";
import { prisma } from "@/shared/lib/infra/prisma";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicNewsPage() {
  const locale = await getLocale();
  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
  const tenantId = tenant?.id || "";

  const newsList = await prisma.newsArticle.findMany({
    where: { tenantId, status: "PUBLISHED" },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {locale === "en" ? "News & Announcements" : "ข่าวสารและประชาสัมพันธ์"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === "en"
            ? "Stay updated with recent academic achievements, seminars, student activities, and faculty notices."
            : "ติดตามข่าวสารความเคลื่อนไหว กิจกรรมวิชาการ และประกาศสำคัญของคณะ"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {newsList.length > 0 ? (
          newsList.map((news) => (
            <div key={news.id} className="group rounded-xl border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
              <div className="h-48 bg-muted/60 relative overflow-hidden flex items-center justify-center">
                {news.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={news.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                )}
                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {news.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {news.publishedAt ? formatDate(news.publishedAt, locale) : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {news.viewCount}
                    </span>
                  </div>
                  <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                    {locale === "en" ? news.titleEn : news.titleTh}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {locale === "en" ? news.summaryEn : news.summaryTh}
                  </p>
                </div>
                <Link href={`/portal/news/${news.slug}`} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 pt-2">
                  <span>{locale === "en" ? "Read full article" : "อ่านต่อ"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm border rounded-xl">
            {locale === "en" ? "No news published yet" : "ยังไม่มีข่าวสารที่เผยแพร่"}
          </div>
        )}
      </div>
    </div>
  );
}
