import { z } from "zod";

export const documentTypeEnum = z.enum([
  "MEMO",
  "BUDGET_REQUEST",
  "LEAVE_ACADEMIC",
  "TRAVEL",
  "PROCUREMENT",
  "GENERAL",
  "PUBLIC_ANNOUNCEMENT",
]);

export const documentPriorityEnum = z.enum(["NORMAL", "URGENT", "VERY_URGENT"]);

export const documentStatusEnum = z.enum([
  "DRAFT",
  "SUBMITTED",
  "PENDING_REVIEW",
  "IN_REVIEW",
  "APPROVED",
  "RETURNED",
  "REJECTED",
  "CANCELLED",
]);

export const accessLevelEnum = z.enum(["CONFIDENTIAL", "INTERNAL", "PUBLIC"]);

export const approvalActionEnum = z.enum(["APPROVE", "REJECT", "RETURN", "FORWARD"]);

export const createDocumentRequestSchema = z.object({
  title: z.string().min(1, "กรุณากรอกเรื่องหรือหัวข้อเอกสาร").max(255),
  docType: documentTypeEnum.default("GENERAL"),
  priority: documentPriorityEnum.default("NORMAL"),
  accessLevel: accessLevelEnum.default("CONFIDENTIAL"),
  department: z.string().max(150).optional(),
  fileUrl: z.string().max(500).optional().or(z.literal("")),
  payload: z.record(z.string(), z.unknown()).default({}),
  status: documentStatusEnum.default("DRAFT"),
});

export const updateDocumentRequestSchema = createDocumentRequestSchema.partial().extend({
  id: z.string().uuid(),
});

export const submitDocumentSchema = z.object({
  requestId: z.string().uuid(),
});

export const processApprovalSchema = z.object({
  requestId: z.string().uuid(),
  action: approvalActionEnum,
  comments: z.string().max(2000).optional(),
});

export const approveDocumentSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  comments: z.string().max(2000).optional(),
});

export const addAttachmentSchema = z.object({
  requestId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url().max(500),
  fileSize: z.number().int().min(1),
  mimeType: z.string().max(100),
});

export type CreateDocumentRequestInput = z.infer<typeof createDocumentRequestSchema>;
export type UpdateDocumentRequestInput = z.infer<typeof updateDocumentRequestSchema>;
export type SubmitDocumentInput = z.infer<typeof submitDocumentSchema>;
export type ProcessApprovalInput = z.infer<typeof processApprovalSchema>;
export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>;
export type AddAttachmentInput = z.infer<typeof addAttachmentSchema>;
