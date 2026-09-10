import type { PermissionDef } from "@/shared/lib/permission-def";

export const DOCUMENTS_P = {
  documentRead: "document:read",
  documentSubmit: "document:submit",
  documentReview: "document:review",
  documentApprove: "document:approve",
  documentPublish: "document:publish",
  documentManage: "document:manage",
} as const;

export const DOCUMENTS_PERMISSIONS: readonly PermissionDef[] = [
  { code: DOCUMENTS_P.documentRead, module: "documents", action: "read" },
  { code: DOCUMENTS_P.documentSubmit, module: "documents", action: "submit" },
  { code: DOCUMENTS_P.documentReview, module: "documents", action: "review" },
  { code: DOCUMENTS_P.documentApprove, module: "documents", action: "approve" },
  { code: DOCUMENTS_P.documentPublish, module: "documents", action: "publish" },
  { code: DOCUMENTS_P.documentManage, module: "documents", action: "manage" },
];
