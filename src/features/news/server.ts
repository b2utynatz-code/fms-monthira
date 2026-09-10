import "server-only";

export { listNews, getNewsBySlug, type NewsArticleDto } from "./_internal/services";
export { NEWS_P, NEWS_PERMISSIONS } from "./permissions";
