"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { DOCUMENTS_P } from "../permissions";
import {
  createDocumentRequestSchema,
  updateDocumentRequestSchema,
  processApprovalSchema,
  addAttachmentSchema,
  type ProcessApprovalInput,
} from "./validations";
import {
  createDocumentRequest,
  updateDocumentRequest,
  submitDocumentRequest,
  processDocumentApproval,
  deleteDocumentRequest,
  listDocumentRequests,
  addDocumentAttachment,
  findDocumentByTrackingCode,
  type DocumentRequestDto,
  type DocumentAttachmentDto,
} from "./services";

export async function getDocumentRequestListAction(options?: {
  requesterId?: string;
  tab?: "pending" | "my" | "all";
}): Promise<ActionResult<DocumentRequestDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentRead);
    return listDocumentRequests(ctx.tenantId, {
      ...options,
      userId: ctx.userId,
    });
  });
}

export async function createDocumentRequestAction(input: unknown): Promise<ActionResult<DocumentRequestDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentSubmit);
    const parsed = createDocumentRequestSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createDocumentRequest(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/documents");
    return result;
  });
}

export async function updateDocumentRequestAction(input: unknown): Promise<ActionResult<DocumentRequestDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentSubmit);
    const parsed = updateDocumentRequestSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateDocumentRequest(ctx.tenantId, parsed);
    revalidatePath("/documents");
    return result;
  });
}

export async function submitDocumentAction(requestId: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentSubmit);
    await submitDocumentRequest(ctx.tenantId, ctx.userId, requestId);
    revalidatePath("/documents");
  });
}

export async function processApprovalAction(input: ProcessApprovalInput): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentApprove);
    const parsed = processApprovalSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await processDocumentApproval(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/documents");
  });
}

export async function addAttachmentAction(input: unknown): Promise<ActionResult<DocumentAttachmentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentSubmit);
    const parsed = addAttachmentSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await addDocumentAttachment(ctx.tenantId, parsed);
    revalidatePath("/documents");
    return result;
  });
}

export async function deleteDocumentRequestAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentManage);
    await deleteDocumentRequest(ctx.tenantId, id);
    revalidatePath("/documents");
  });
}

export async function trackDocumentPublicAction(trackingCode: string): Promise<ActionResult<DocumentRequestDto | null>> {
  return runAction(async () => {
    return findDocumentByTrackingCode(trackingCode);
  });
}
