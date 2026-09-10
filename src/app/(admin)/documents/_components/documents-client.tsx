"use client";

import { useState, useTransition } from "react";
import { Plus, CheckCircle, XCircle, FileText, Send, Eye, Copy, RotateCcw, AlertCircle } from "lucide-react";
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
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import type { DocumentRequestDto, CreateDocumentRequestInput } from "@/features/documents";
import {
  createDocumentRequestAction,
  submitDocumentAction,
  processApprovalAction,
  deleteDocumentRequestAction,
} from "@/features/documents/actions";

interface DocumentsClientProps {
  initialItems: DocumentRequestDto[];
  currentUserId?: string;
  canApprove: boolean;
  canManage: boolean;
}

const DOC_TYPE_MAP = {
  MEMO: "documents.type.MEMO",
  BUDGET_REQUEST: "documents.type.BUDGET_REQUEST",
  LEAVE_ACADEMIC: "documents.type.LEAVE_ACADEMIC",
  TRAVEL: "documents.type.TRAVEL",
  PROCUREMENT: "documents.type.PROCUREMENT",
  GENERAL: "documents.type.GENERAL",
  PUBLIC_ANNOUNCEMENT: "documents.type.PUBLIC_ANNOUNCEMENT",
} as const;

const DOC_PRIORITY_MAP = {
  NORMAL: "documents.prio.NORMAL",
  URGENT: "documents.prio.URGENT",
  VERY_URGENT: "documents.prio.VERY_URGENT",
} as const;

const DOC_STATUS_MAP = {
  DRAFT: "documents.status.DRAFT",
  SUBMITTED: "documents.status.SUBMITTED",
  PENDING_REVIEW: "documents.status.PENDING_REVIEW",
  IN_REVIEW: "documents.status.IN_REVIEW",
  APPROVED: "documents.status.APPROVED",
  RETURNED: "documents.status.RETURNED",
  REJECTED: "documents.status.REJECTED",
  CANCELLED: "documents.status.CANCELLED",
} as const;

export function DocumentsClient({ initialItems, currentUserId, canApprove, canManage }: DocumentsClientProps) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<DocumentRequestDto[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"pending" | "my" | "all">("all");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<DocumentRequestDto | null>(null);
  const [approvalModalItem, setApprovalModalItem] = useState<DocumentRequestDto | null>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVE" | "RETURN" | "REJECT">("APPROVE");
  const [approvalComment, setApprovalComment] = useState("");

  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<CreateDocumentRequestInput["docType"]>("GENERAL");
  const [priority, setPriority] = useState<CreateDocumentRequestInput["priority"]>("NORMAL");
  const [accessLevel, setAccessLevel] = useState<CreateDocumentRequestInput["accessLevel"]>("CONFIDENTIAL");
  const [department, setDepartment] = useState("");

  const filteredItems = items.filter((item) => {
    if (activeTab === "pending") {
      return item.status === "SUBMITTED" || item.status === "IN_REVIEW" || item.status === "PENDING_REVIEW";
    }
    if (activeTab === "my") {
      return item.requesterId === currentUserId;
    }
    return true;
  });

  const openCreateDialog = () => {
    setTitle("");
    setDocType("GENERAL");
    setPriority("NORMAL");
    setAccessLevel("CONFIDENTIAL");
    setDepartment("");
    setCreateModalOpen(true);
  };

  const handleCreate = (isSubmitNow: boolean) => {
    if (!title.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      const payload: CreateDocumentRequestInput = {
        title,
        docType,
        priority,
        accessLevel,
        department: department.trim() || undefined,
        status: isSubmitNow ? "SUBMITTED" : "DRAFT",
        payload: {},
      };
      const res = await createDocumentRequestAction(payload);
      if (res.ok) {
        setItems((prev) => [res.data, ...prev]);
        toast.success(t("common.save"));
        setCreateModalOpen(false);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const handleSubmitRequest = (id: string) => {
    startTransition(async () => {
      const res = await submitDocumentAction(id);
      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, status: "SUBMITTED" } : it))
        );
        toast.success(t("documents.submit"));
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const handleProcessApproval = () => {
    if (!approvalModalItem) return;

    startTransition(async () => {
      const res = await processApprovalAction({
        requestId: approvalModalItem.id,
        action: approvalAction,
        comments: approvalComment.trim() || undefined,
      });
      if (res.ok) {
        const nextStatus =
          approvalAction === "APPROVE"
            ? approvalModalItem.currentStep >= approvalModalItem.totalSteps
              ? "APPROVED"
              : "IN_REVIEW"
            : approvalAction === "RETURN"
            ? "RETURNED"
            : "REJECTED";

        setItems((prev) =>
          prev.map((it) =>
            it.id === approvalModalItem.id
              ? {
                  ...it,
                  status: nextStatus,
                  currentStep:
                    approvalAction === "APPROVE"
                      ? Math.min(it.currentStep + 1, it.totalSteps)
                      : it.currentStep,
                }
              : it
          )
        );
        toast.success(t("common.save"));
        setApprovalModalItem(null);
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      const res = await deleteDocumentRequestAction(id);
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        toast.success(t("common.delete"));
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const copyTrackingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("คัดลอกรหัสติดตามแล้ว: " + code);
  };

  const columns: DataTableColumn<DocumentRequestDto>[] = [
    {
      key: "docNumber",
      header: t("documents.docNumber"),
      className: "nowrap font-mono font-medium text-xs",
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.docNumber || "—"}</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <span>{row.trackingCode}</span>
            <button
              onClick={() => copyTrackingCode(row.trackingCode)}
              className="hover:text-primary"
              title="Copy tracking code"
            >
              <Copy className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: t("documents.subject"),
      render: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.title}</div>
          <div className="text-xs text-muted-foreground">
            {t(DOC_TYPE_MAP[row.docType as keyof typeof DOC_TYPE_MAP] ?? "documents.type.GENERAL")}
            {row.department && ` • ${row.department}`}
          </div>
        </div>
      ),
    },
    {
      key: "priority",
      header: t("documents.priority"),
      className: "nowrap text-xs",
      render: (row) => {
        const tone = row.priority === "VERY_URGENT" ? "bad" : row.priority === "URGENT" ? "warn" : "info";
        return <StatusPill tone={tone}>{t(DOC_PRIORITY_MAP[row.priority as keyof typeof DOC_PRIORITY_MAP] ?? "documents.prio.NORMAL")}</StatusPill>;
      },
    },
    {
      key: "step",
      header: t("documents.step"),
      className: "nowrap text-xs text-center",
      render: (row) => (
        <span className="font-mono px-2 py-0.5 bg-muted rounded-md">
          {row.currentStep} / {row.totalSteps}
        </span>
      ),
    },
    {
      key: "requester",
      header: t("documents.requester"),
      className: "nowrap text-xs text-muted-foreground",
      render: (row) => <span>{row.requesterName}</span>,
    },
    {
      key: "status",
      header: t("documents.status"),
      className: "nowrap",
      render: (row) => {
        const tone =
          row.status === "APPROVED"
            ? "ok"
            : row.status === "IN_REVIEW" || row.status === "SUBMITTED" || row.status === "PENDING_REVIEW"
            ? "info"
            : row.status === "RETURNED"
            ? "warn"
            : row.status === "REJECTED"
            ? "bad"
            : "off";
        return <StatusPill tone={tone}>{t(DOC_STATUS_MAP[row.status as keyof typeof DOC_STATUS_MAP] ?? "documents.status.DRAFT")}</StatusPill>;
      },
    },
    {
      key: "createdAt",
      header: t("common.actions"),
      className: "nowrap text-xs text-muted-foreground",
      render: (row) => <span>{formatDate(new Date(row.createdAt), locale)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("documents.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("documents.description")}</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t("documents.create")}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b pb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("documents.tab.all")} ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("documents.tab.pending")} (
          {items.filter((i) => i.status === "SUBMITTED" || i.status === "IN_REVIEW" || i.status === "PENDING_REVIEW").length}
          )
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "my" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("documents.tab.my")} ({items.filter((i) => i.requesterId === currentUserId).length})
        </button>
      </div>

      <LiyonCard>
        <DataTable<DocumentRequestDto>
          state={filteredItems.length === 0 ? "empty" : "data"}
          rows={filteredItems}
          columns={columns}
          getRowId={(row) => row.id}
          headHeading={<span>{t("documents.title")}</span>}
          renderRowMenu={(row) => (
            <>
              <RowMenuItem onSelect={() => setDetailModalItem(row)}>
                <Eye className="h-4 w-4 text-muted-foreground mr-2" />
                <span>ดูรายละเอียด & สายอนุมัติ</span>
              </RowMenuItem>

              {(row.status === "DRAFT" || row.status === "RETURNED") && row.requesterId === currentUserId && (
                <RowMenuItem onSelect={() => handleSubmitRequest(row.id)}>
                  <Send className="h-4 w-4 text-primary mr-2" />
                  <span>{t("documents.submit")}</span>
                </RowMenuItem>
              )}

              {canApprove && (row.status === "SUBMITTED" || row.status === "IN_REVIEW" || row.status === "PENDING_REVIEW") && (
                <RowMenuItem onSelect={() => setApprovalModalItem(row)}>
                  <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                  <span>พิจารณาอนุมัติ / เกษียนหนังสือ</span>
                </RowMenuItem>
              )}

              {canManage && (
                <RowMenuItem onSelect={() => handleDelete(row.id)} danger>
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>{t("common.delete")}</span>
                </RowMenuItem>
              )}
            </>
          )}
          empty={{
            icon: <FileText className="h-10 w-10 text-muted-foreground/50" />,
            title: t("documents.title"),
            description: t("documents.description"),
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: t("common.error"),
          }}
        />
      </LiyonCard>

      <LiyonDialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <LiyonDialogHeader
          title={t("documents.create")}
          description={t("documents.description")}
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <LiyonField label={t("documents.subject")}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ระบุเรื่องหรือหัวข้อเอกสาร"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiyonField label={t("documents.type")}>
                <LiyonSelect value={docType} onChange={(e) => setDocType(e.target.value as CreateDocumentRequestInput["docType"])}>
                  <option value="GENERAL">{t("documents.type.GENERAL")}</option>
                  <option value="MEMO">{t("documents.type.MEMO")}</option>
                  <option value="BUDGET_REQUEST">{t("documents.type.BUDGET_REQUEST")}</option>
                  <option value="LEAVE_ACADEMIC">{t("documents.type.LEAVE_ACADEMIC")}</option>
                  <option value="TRAVEL">{t("documents.type.TRAVEL")}</option>
                  <option value="PROCUREMENT">{t("documents.type.PROCUREMENT")}</option>
                  <option value="PUBLIC_ANNOUNCEMENT">{t("documents.type.PUBLIC_ANNOUNCEMENT")}</option>
                </LiyonSelect>
              </LiyonField>
              <LiyonField label={t("documents.priority")}>
                <LiyonSelect value={priority} onChange={(e) => setPriority(e.target.value as CreateDocumentRequestInput["priority"])}>
                  <option value="NORMAL">{t("documents.prio.NORMAL")}</option>
                  <option value="URGENT">{t("documents.prio.URGENT")}</option>
                  <option value="VERY_URGENT">{t("documents.prio.VERY_URGENT")}</option>
                </LiyonSelect>
              </LiyonField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiyonField label="การเข้าถึง">
                <LiyonSelect value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as CreateDocumentRequestInput["accessLevel"])}>
                  <option value="CONFIDENTIAL">ลับเฉพาะภายใน</option>
                  <option value="INTERNAL">บุคลากรภายในคณะ</option>
                  <option value="PUBLIC">สาธารณะ (แสดงบน Portal)</option>
                </LiyonSelect>
              </LiyonField>
              <LiyonField label="หน่วยงาน / ภาควิชา">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น สาขาวิชาวิทยาการคอมพิวเตอร์"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="secondary" onClick={() => handleCreate(false)} disabled={isPending}>
            บันทึกฉบับร่าง (Draft)
          </Button>
          <Button onClick={() => handleCreate(true)} disabled={isPending}>
            {t("documents.submit")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      <LiyonDialog open={!!approvalModalItem} onOpenChange={(open) => !open && setApprovalModalItem(null)}>
        <LiyonDialogHeader
          title="พิจารณาและเกษียนหนังสือ"
          description={`เอกสารเลขที่: ${approvalModalItem?.docNumber || "—"} (ขั้นตอนที่ ${approvalModalItem?.currentStep} จาก ${approvalModalItem?.totalSteps})`}
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/60 rounded-lg text-sm space-y-1">
              <div className="font-semibold text-foreground">{approvalModalItem?.title}</div>
              <div className="text-xs text-muted-foreground">
                ผู้ยื่น: {approvalModalItem?.requesterName} • แผนก: {approvalModalItem?.department || "—"}
              </div>
            </div>

            <LiyonField label="ผลการพิจารณา">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalAction("APPROVE")}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    approvalAction === "APPROVE"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>เห็นชอบ / อนุมัติ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalAction("RETURN")}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    approvalAction === "RETURN"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>ส่งกลับแก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalAction("REJECT")}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    approvalAction === "REJECT"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  <span>ไม่อนุมัติ</span>
                </button>
              </div>
            </LiyonField>

            <LiyonField label={t("documents.comments")}>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="บันทึกข้อความเกษียนหนังสือ หรือเหตุผลการส่งกลับ/ไม่อนุมัติ..."
                rows={4}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </LiyonField>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setApprovalModalItem(null)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleProcessApproval} disabled={isPending}>
            บันทึกการพิจารณา
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      <LiyonDialog open={!!detailModalItem} onOpenChange={(open) => !open && setDetailModalItem(null)} wide>
        <LiyonDialogHeader
          title={detailModalItem?.title || "รายละเอียดเอกสาร"}
          description={`เลขที่เอกสาร: ${detailModalItem?.docNumber || "—"} | รหัส e-Tracking: ${detailModalItem?.trackingCode || "—"}`}
        />
        <LiyonDialogBody>
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border text-xs">
              <div>
                <span className="text-muted-foreground block">ประเภทเอกสาร:</span>
                <span className="font-semibold">{detailModalItem ? t(DOC_TYPE_MAP[detailModalItem.docType as keyof typeof DOC_TYPE_MAP] ?? "documents.type.GENERAL") : ""}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">ความเร่งด่วน:</span>
                <span className="font-semibold">{detailModalItem ? t(DOC_PRIORITY_MAP[detailModalItem.priority as keyof typeof DOC_PRIORITY_MAP] ?? "documents.prio.NORMAL") : ""}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">ผู้ยื่นคำขอ:</span>
                <span className="font-semibold">{detailModalItem?.requesterName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">วันที่ยื่น:</span>
                <span className="font-semibold">{detailModalItem?.submittedAt ? formatDate(new Date(detailModalItem.submittedAt), locale) : "ฉบับร่าง"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>{t("documents.routingSlip")}</span>
              </h3>

              {detailModalItem?.approvals && detailModalItem.approvals.length > 0 ? (
                <div className="relative border-l-2 border-primary/30 ml-4 space-y-6 py-2">
                  {detailModalItem.approvals.map((ap) => (
                    <div key={ap.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="bg-card border rounded-lg p-3 text-xs space-y-1 shadow-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span>ขั้นตอนที่ {ap.stepOrder}: {ap.approverName}</span>
                          <span className="text-primary font-mono">{ap.action}</span>
                        </div>
                        {ap.comments && (
                          <p className="text-muted-foreground italic bg-muted/30 p-2 rounded mt-1">
                            &ldquo;{ap.comments}&rdquo;
                          </p>
                        )}
                        <div className="text-[10px] text-muted-foreground pt-1">
                          ลงนามเมื่อ: {ap.signedAt ? formatDate(new Date(ap.signedAt), locale) : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border rounded-lg text-center text-xs text-muted-foreground">
                  ยังไม่มีประวัติการลงนามเกษียนหนังสือ
                </div>
              )}
            </div>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDetailModalItem(null)}>
            {t("common.close")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
