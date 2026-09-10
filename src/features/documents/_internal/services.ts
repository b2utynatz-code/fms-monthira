import { prisma } from "@/shared/lib/infra/prisma";
import type { DocumentStatus, DocumentType, DocumentPriority, AccessLevel, Prisma } from "@/generated/prisma";
import type {
  CreateDocumentRequestInput,
  UpdateDocumentRequestInput,
  ProcessApprovalInput,
  AddAttachmentInput,
} from "./validations";
import { generateDocNumber, generateTrackingCode, evaluateWorkflowTransition } from "./workflow";

export interface DocumentApprovalDto {
  id: string;
  stepOrder: number;
  roleRequired: string | null;
  approverId: string | null;
  approverName: string;
  action: string | null;
  comments: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface DocumentAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DocumentRequestDto {
  id: string;
  tenantId: string;
  docNumber: string | null;
  trackingCode: string;
  title: string;
  docType: DocumentType;
  priority: DocumentPriority;
  accessLevel: AccessLevel;
  department: string | null;
  requesterId: string;
  requesterName: string;
  currentStep: number;
  totalSteps: number;
  status: DocumentStatus;
  fileUrl: string | null;
  payload: Record<string, unknown>;
  submittedAt: string | null;
  completedAt: string | null;
  approvals: DocumentApprovalDto[];
  attachments: DocumentAttachmentDto[];
  createdAt: string;
  updatedAt: string;
}

export async function listDocumentRequests(
  tenantId: string,
  options?: {
    requesterId?: string;
    status?: DocumentStatus;
    docType?: DocumentType;
    tab?: "pending" | "my" | "all";
    userId?: string;
  }
): Promise<DocumentRequestDto[]> {
  const where: Prisma.DocumentRequestWhereInput = { tenantId };

  if (options?.tab === "my" && options.userId) {
    where.requesterId = options.userId;
  } else if (options?.tab === "pending") {
    where.status = { in: ["SUBMITTED", "IN_REVIEW", "PENDING_REVIEW"] };
  } else if (options?.requesterId) {
    where.requesterId = options.requesterId;
  }

  if (options?.status) {
    where.status = options.status;
  }
  if (options?.docType) {
    where.docType = options.docType;
  }

  const items = await prisma.documentRequest.findMany({
    where,
    include: {
      requester: { select: { name: true } },
      approvals: {
        include: { approver: { select: { name: true } } },
        orderBy: { stepOrder: "asc" },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map(mapToDocumentDto);
}

export async function getDocumentRequestById(tenantId: string, id: string): Promise<DocumentRequestDto | null> {
  const item = await prisma.documentRequest.findUnique({
    where: { id, tenantId },
    include: {
      requester: { select: { name: true } },
      approvals: {
        include: { approver: { select: { name: true } } },
        orderBy: { stepOrder: "asc" },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  return item ? mapToDocumentDto(item) : null;
}

export async function findDocumentByTrackingCode(trackingCode: string): Promise<DocumentRequestDto | null> {
  const item = await prisma.documentRequest.findFirst({
    where: { trackingCode: trackingCode.trim().toUpperCase() },
    include: {
      requester: { select: { name: true } },
      approvals: {
        include: { approver: { select: { name: true } } },
        orderBy: { stepOrder: "asc" },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  return item ? mapToDocumentDto(item) : null;
}

export async function listPublicDocuments(tenantId?: string): Promise<DocumentRequestDto[]> {
  const items = await prisma.documentRequest.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      accessLevel: "PUBLIC",
      status: "APPROVED",
    },
    include: {
      requester: { select: { name: true } },
      approvals: {
        include: { approver: { select: { name: true } } },
        orderBy: { stepOrder: "asc" },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return items.map(mapToDocumentDto);
}

export async function createDocumentRequest(
  tenantId: string,
  requesterId: string,
  input: CreateDocumentRequestInput
): Promise<DocumentRequestDto> {
  const count = await prisma.documentRequest.count({ where: { tenantId } });
  const year = new Date().getFullYear() + 543;
  const docNumber = generateDocNumber(count, year);
  const trackingCode = generateTrackingCode();

  // กำหนดจำนวนขั้นตอนเริ่มต้น (เช่น 2 ขั้นตอน: เจ้าหน้าที่ตรวจสอบ -> ผู้บริหารอนุมัติ)
  const totalSteps = input.docType === "BUDGET_REQUEST" || input.docType === "TRAVEL" ? 3 : 2;

  const created = await prisma.$transaction(async (tx) => {
    const doc = await tx.documentRequest.create({
      data: {
        tenantId,
        requesterId,
        docNumber,
        trackingCode,
        title: input.title,
        docType: input.docType,
        priority: input.priority,
        accessLevel: input.accessLevel,
        department: input.department || null,
        fileUrl: input.fileUrl || null,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        status: input.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
        currentStep: 1,
        totalSteps,
        submittedAt: input.status === "SUBMITTED" ? new Date() : null,
      },
      include: {
        requester: { select: { name: true } },
        approvals: {
          include: { approver: { select: { name: true } } },
          orderBy: { stepOrder: "asc" },
        },
        attachments: true,
      },
    });

    // สร้างบันทึก Audit
    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: requesterId,
        action: "document.create",
        entity: "document_request",
        entityId: doc.id,
        after: { title: doc.title, docType: doc.docType, docNumber: doc.docNumber },
      },
    });

    return doc;
  });

  return mapToDocumentDto(created);
}

export async function updateDocumentRequest(
  tenantId: string,
  input: UpdateDocumentRequestInput
): Promise<DocumentRequestDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.documentRequest.findUnique({
      where: { id: input.id, tenantId },
    });
    if (!existing) throw new Error("Document request not found");

    // ไม่อนุญาตให้แก้ไขถ้าอนุมัติแล้วหรือถูกปฏิเสธแล้ว
    if (existing.status === "APPROVED" || existing.status === "REJECTED") {
      throw new Error("Cannot edit completed document");
    }

    const doc = await tx.documentRequest.update({
      where: { id: input.id, tenantId },
      data: {
        title: input.title,
        docType: input.docType,
        priority: input.priority,
        accessLevel: input.accessLevel,
        department: input.department,
        fileUrl: input.fileUrl || null,
        payload: input.payload ? (input.payload as Prisma.InputJsonValue) : undefined,
        status: input.status,
      },
      include: {
        requester: { select: { name: true } },
        approvals: {
          include: { approver: { select: { name: true } } },
          orderBy: { stepOrder: "asc" },
        },
        attachments: true,
      },
    });

    return doc;
  });

  return mapToDocumentDto(updated);
}

export async function submitDocumentRequest(tenantId: string, requesterId: string, requestId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const doc = await tx.documentRequest.findUnique({
      where: { id: requestId, tenantId },
    });
    if (!doc) throw new Error("Document request not found");
    if (doc.requesterId !== requesterId) throw new Error("Unauthorized to submit this document");

    await tx.documentRequest.update({
      where: { id: requestId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: requesterId,
        action: "document.submit",
        entity: "document_request",
        entityId: requestId,
      },
    });
  });
}

export async function processDocumentApproval(
  tenantId: string,
  approverId: string,
  input: ProcessApprovalInput
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const doc = await tx.documentRequest.findUnique({
      where: { id: input.requestId, tenantId },
    });
    if (!doc) throw new Error("Document request not found");

    // คำนวณการเลื่อนสถานะและขั้นตอน
    const { nextStep, nextStatus } = evaluateWorkflowTransition({
      currentStep: doc.currentStep,
      totalSteps: doc.totalSteps,
      action: input.action,
    });

    // บันทึก Routing Slip การลงนาม/เกษียน
    await tx.documentApproval.create({
      data: {
        requestId: input.requestId,
        approverId,
        stepOrder: doc.currentStep,
        action: input.action,
        comments: input.comments || null,
        signedAt: new Date(),
      },
    });

    // อัปเดตสถานะของเอกสาร
    await tx.documentRequest.update({
      where: { id: input.requestId },
      data: {
        currentStep: nextStep,
        status: nextStatus,
        completedAt: nextStatus === "APPROVED" || nextStatus === "REJECTED" ? new Date() : null,
      },
    });

    // บันทึก Audit Log
    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: approverId,
        action: `document.approval_${input.action.toLowerCase()}`,
        entity: "document_request",
        entityId: input.requestId,
        after: { step: doc.currentStep, action: input.action, nextStatus },
      },
    });
  });
}

export async function addDocumentAttachment(
  tenantId: string,
  input: AddAttachmentInput
): Promise<DocumentAttachmentDto> {
  const doc = await prisma.documentRequest.findUnique({
    where: { id: input.requestId, tenantId },
  });
  if (!doc) throw new Error("Document request not found");

  const attachment = await prisma.documentAttachment.create({
    data: {
      requestId: input.requestId,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
    },
  });

  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    uploadedAt: attachment.uploadedAt.toISOString(),
  };
}

export async function deleteDocumentRequest(tenantId: string, id: string): Promise<void> {
  await prisma.documentRequest.delete({
    where: { id, tenantId },
  });
}

type DocumentRequestWithRelations = Prisma.DocumentRequestGetPayload<{
  include: {
    requester: { select: { name: true } };
    approvals: {
      include: { approver: { select: { name: true } } };
    };
    attachments: true;
  };
}>;

// Helper mapping
function mapToDocumentDto(item: DocumentRequestWithRelations): DocumentRequestDto {
  return {
    id: item.id,
    tenantId: item.tenantId,
    docNumber: item.docNumber,
    trackingCode: item.trackingCode,
    title: item.title,
    docType: item.docType,
    priority: item.priority,
    accessLevel: item.accessLevel,
    department: item.department,
    requesterId: item.requesterId,
    requesterName: item.requester?.name ?? "",
    currentStep: item.currentStep,
    totalSteps: item.totalSteps,
    status: item.status,
    fileUrl: item.fileUrl,
    payload: (item.payload as Record<string, unknown>) || {},
    submittedAt: item.submittedAt ? item.submittedAt.toISOString() : null,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    approvals: (item.approvals || []).map((ap) => ({
      id: ap.id,
      stepOrder: ap.stepOrder,
      roleRequired: ap.roleRequired,
      approverId: ap.approverId,
      approverName: ap.approver?.name ?? "—",
      action: ap.action,
      comments: ap.comments,
      signedAt: ap.signedAt ? ap.signedAt.toISOString() : null,
      createdAt: ap.createdAt.toISOString(),
    })),
    attachments: (item.attachments || []).map((at) => ({
      id: at.id,
      fileName: at.fileName,
      fileUrl: at.fileUrl,
      fileSize: at.fileSize,
      mimeType: at.mimeType,
      uploadedAt: at.uploadedAt.toISOString(),
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
