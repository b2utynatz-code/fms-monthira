"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Newspaper, AlertCircle, Eye, Pin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable,
  LiyonCard,
  RowMenuItem,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
  LiyonSelect,
  TinyEditor,
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import type { NewsArticleDto, CreateNewsInput } from "@/features/news";
import { createNewsAction, updateNewsAction, deleteNewsAction, translateNewsWithGeminiAction } from "@/features/news/actions";

interface NewsClientProps {
  initialItems: NewsArticleDto[];
  canManage: boolean;
}

export function NewsClient({ initialItems, canManage }: NewsClientProps) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<NewsArticleDto[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsArticleDto | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<NewsArticleDto | null>(null);

  // Form states
  const [titleTh, setTitleTh] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [summaryTh, setSummaryTh] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [contentTh, setContentTh] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [category, setCategory] = useState<"ACADEMIC" | "ACTIVITY" | "RESEARCH" | "ANNOUNCEMENT" | "PROCUREMENT">("ANNOUNCEMENT");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [isPinned, setIsPinned] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleAiTranslate = async () => {
    if (!titleTh.trim() || !contentTh.trim()) {
      toast.error(t("news.aiRequireThai"));
      return;
    }

    setIsTranslating(true);
    try {
      const res = await translateNewsWithGeminiAction({
        titleTh,
        summaryTh: summaryTh || undefined,
        contentTh,
      });
      if (res.ok) {
        setTitleEn(res.data.titleEn);
        if (res.data.summaryEn) setSummaryEn(res.data.summaryEn);
        setContentEn(res.data.contentEn);
        toast.success(t("news.aiSuccess"));
      } else {
        toast.error(res.error.message || t("common.error"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || t("common.error"));
    } finally {
      setIsTranslating(false);
    }
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setTitleTh("");
    setTitleEn("");
    setSummaryTh("");
    setSummaryEn("");
    setContentTh("");
    setContentEn("");
    setCategory("ANNOUNCEMENT");
    setStatus("DRAFT");
    setIsPinned(false);
    setModalOpen(true);
  };

  const openEditDialog = (item: NewsArticleDto) => {
    setEditingItem(item);
    setTitleTh(item.titleTh);
    setTitleEn(item.titleEn);
    setSummaryTh(item.summaryTh || "");
    setSummaryEn(item.summaryEn || "");
    setContentTh(item.contentTh);
    setContentEn(item.contentEn || "");
    setCategory(item.category);
    setStatus(item.status);
    setIsPinned(item.isPinned);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!titleTh.trim() || !titleEn.trim() || !contentTh.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateNewsAction({
          id: editingItem.id,
          titleTh,
          titleEn,
          summaryTh: summaryTh || undefined,
          summaryEn: summaryEn || undefined,
          contentTh,
          contentEn: contentEn || undefined,
          category,
          status,
          isPinned,
        });
        if (res.ok) {
          setItems((prev) => prev.map((it) => (it.id === editingItem.id ? res.data : it)));
          toast.success(t("common.save"));
          setModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      } else {
        const payload: CreateNewsInput = {
          titleTh,
          titleEn,
          summaryTh: summaryTh || undefined,
          summaryEn: summaryEn || undefined,
          contentTh,
          contentEn: contentEn || undefined,
          category,
          status,
          isPinned,
          pinPriority: isPinned ? 1 : 0,
        };
        const res = await createNewsAction(payload);
        if (res.ok) {
          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.save"));
          setModalOpen(false);
        } else {
          toast.error(t("common.error"));
        }
      }
    });
  };

  const handleDelete = (item: NewsArticleDto) => {
    startTransition(async () => {
      const res = await deleteNewsAction(item.id);
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        toast.success(t("common.save"));
        setDeleteConfirmItem(null);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const categoryLabels: Record<string, string> = {
    ACADEMIC: t("news.cat.ACADEMIC"),
    ACTIVITY: t("news.cat.ACTIVITY"),
    RESEARCH: t("news.cat.RESEARCH"),
    ANNOUNCEMENT: t("news.cat.ANNOUNCEMENT"),
    PROCUREMENT: t("news.cat.PROCUREMENT"),
  };

  const statusLabels: Record<string, string> = {
    DRAFT: t("news.status.DRAFT"),
    PUBLISHED: t("news.status.PUBLISHED"),
    ARCHIVED: t("news.status.ARCHIVED"),
  };

  const columns: DataTableColumn<NewsArticleDto>[] = [
    {
      key: "title",
      header: t("news.title"),
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isPinned && <Pin className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
          <div>
            <div className="font-medium">{locale === "en" ? row.titleEn : row.titleTh}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{locale === "en" ? row.summaryEn : row.summaryTh}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: t("news.category"),
      className: "nowrap text-xs",
      render: (row) => <span>{categoryLabels[row.category] || row.category}</span>,
    },
    {
      key: "status",
      header: t("news.status"),
      className: "nowrap",
      render: (row) => {
        const tone = row.status === "PUBLISHED" ? "ok" : row.status === "DRAFT" ? "warn" : "off";
        return <StatusPill tone={tone}>{statusLabels[row.status] || row.status}</StatusPill>;
      },
    },
    {
      key: "views",
      header: t("news.views"),
      className: "nowrap text-center text-xs text-muted-foreground",
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {row.viewCount}
        </span>
      ),
    },
    {
      key: "publishedAt",
      header: t("news.publishedAt"),
      className: "nowrap text-xs text-muted-foreground",
      render: (row) => <span>{row.publishedAt ? formatDate(new Date(row.publishedAt), locale) : "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("news.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("news.description")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("news.create")}
          </Button>
        )}
      </div>

      <LiyonCard>
        <DataTable<NewsArticleDto>
          state={items.length === 0 ? "empty" : "data"}
          rows={items}
          columns={columns}
          getRowId={(row) => row.id}
          headHeading={<span>{t("news.title")}</span>}
          renderRowMenu={
            canManage
              ? (row) => (
                  <>
                    <RowMenuItem onSelect={() => openEditDialog(row)} icon={<Edit2 className="h-4 w-4" />}>
                      {t("news.edit")}
                    </RowMenuItem>
                    <RowMenuItem onSelect={() => setDeleteConfirmItem(row)} danger icon={<Trash2 className="h-4 w-4" />}>
                      {t("news.delete")}
                    </RowMenuItem>
                  </>
                )
              : undefined
          }
          empty={{
            icon: <Newspaper className="h-10 w-10 text-muted-foreground/50" />,
            title: t("news.title"),
            description: t("news.description"),
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: t("common.error"),
          }}
        />
      </LiyonCard>

      {/* Dialog สร้าง/แก้ไขข่าว */}
      <LiyonDialog open={modalOpen} onOpenChange={setModalOpen} wide>
        <LiyonDialogHeader
          title={editingItem ? t("news.edit") : t("news.create")}
          description={t("news.description")}
        />
        <LiyonDialogBody className="max-h-[70vh] overflow-y-auto pr-2">
          {/* AI Translation Tool Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3 my-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  ระบบช่วยสร้างและแปลข่าวเป็นภาษาอังกฤษด้วย Google Gemini (AI)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  กรอกหัวข้อและเนื้อหาภาษาไทย จากนั้นกดปุ่มเพื่อสร้างหัวข้อ สรุปย่อ และเนื้อหาภาษาอังกฤษอัตโนมัติ
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiTranslate}
              disabled={isTranslating || isPending || !titleTh.trim() || !contentTh.trim()}
              className="gap-1.5 h-8 shrink-0 text-primary border-primary/30 hover:bg-primary/10 font-medium"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("news.aiTranslating")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t("news.aiTranslate")}</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <LiyonField label={t("news.titleTh")}>
              <input
                type="text"
                value={titleTh}
                onChange={(e) => setTitleTh(e.target.value)}
                placeholder="หัวข้อข่าวภาษาไทย"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("news.titleEn")}>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="News Title (English)"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("news.summaryTh")}>
              <input
                type="text"
                value={summaryTh}
                onChange={(e) => setSummaryTh(e.target.value)}
                placeholder="สรุปย่อภาษาไทย"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <LiyonField label={t("news.summaryEn")}>
              <input
                type="text"
                value={summaryEn}
                onChange={(e) => setSummaryEn(e.target.value)}
                placeholder="Summary (English)"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <div className="md:col-span-2">
              <LiyonField label={t("news.contentTh")}>
                <TinyEditor
                  value={contentTh}
                  onChange={setContentTh}
                  placeholder="พิมพ์หรือจัดรูปแบบเนื้อหาข่าวภาษาไทย (รองรับตัวหนา, หัวข้อ, รูปภาพ, ลิงก์)..."
                  minHeight="240px"
                />
              </LiyonField>
            </div>
            <div className="md:col-span-2">
              <LiyonField label={t("news.contentEn")}>
                <TinyEditor
                  value={contentEn}
                  onChange={setContentEn}
                  placeholder="Type or format news content in English..."
                  minHeight="200px"
                />
              </LiyonField>
            </div>
            <LiyonField label={t("news.category")}>
              <LiyonSelect value={category} onChange={(e) => setCategory(e.target.value as CreateNewsInput["category"])}>
                <option value="ACADEMIC">{t("news.cat.ACADEMIC")}</option>
                <option value="ACTIVITY">{t("news.cat.ACTIVITY")}</option>
                <option value="RESEARCH">{t("news.cat.RESEARCH")}</option>
                <option value="ANNOUNCEMENT">{t("news.cat.ANNOUNCEMENT")}</option>
                <option value="PROCUREMENT">{t("news.cat.PROCUREMENT")}</option>
              </LiyonSelect>
            </LiyonField>
            <LiyonField label={t("news.status")}>
              <LiyonSelect value={status} onChange={(e) => setStatus(e.target.value as CreateNewsInput["status"])}>
                <option value="DRAFT">{t("news.status.DRAFT")}</option>
                <option value="PUBLISHED">{t("news.status.PUBLISHED")}</option>
                <option value="ARCHIVED">{t("news.status.ARCHIVED")}</option>
              </LiyonSelect>
            </LiyonField>
            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border"
                />
                <span className="font-medium">{t("news.pinned")}</span>
              </label>
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {t("common.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog ยืนยันการลบ */}
      <LiyonDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)} danger>
        <LiyonDialogHeader
          title={t("news.delete")}
          description={t("common.confirm")}
        />
        <LiyonDialogBody>
          <p className="text-sm text-muted-foreground">
            {locale === "en" ? deleteConfirmItem?.titleEn : deleteConfirmItem?.titleTh}
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)} disabled={isPending}>
            {t("news.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
