import { requirePermission, hasPermission } from "@/features/identity/server";
import { NEWS_P, listNews } from "@/features/news/server";
import { NewsClient } from "./_components/news-client";

export default async function NewsPage() {
  const ctx = await requirePermission(NEWS_P.newsRead);
  const initialItems = await listNews(ctx.tenantId);
  return (
    <NewsClient
      initialItems={initialItems}
      canManage={hasPermission(ctx, NEWS_P.newsManage)}
    />
  );
}
