import type { DocumentStatus, ApprovalAction } from "@/generated/prisma";

export function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "TRK-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateDocNumber(count: number, year: number): string {
  return `DOC-${year}-${String(count + 1).padStart(4, "0")}`;
}

/**
 * คำนวณขั้นตอนและสถานะถัดไปของเอกสารตามการกระทำของผู้พิจารณา
 */
export function evaluateWorkflowTransition(params: {
  currentStep: number;
  totalSteps: number;
  action: ApprovalAction;
}): { nextStep: number; nextStatus: DocumentStatus } {
  const { currentStep, totalSteps, action } = params;

  if (action === "REJECT") {
    return {
      nextStep: currentStep,
      nextStatus: "REJECTED",
    };
  }

  if (action === "RETURN") {
    return {
      nextStep: currentStep,
      nextStatus: "RETURNED",
    };
  }

  // กรณีเห็นชอบ / อนุมัติ หรือส่งต่อ
  if (action === "APPROVE" || action === "FORWARD") {
    if (currentStep >= totalSteps) {
      // สิ้นสุดสายอนุมัติ
      return {
        nextStep: totalSteps,
        nextStatus: "APPROVED",
      };
    }
    // เลื่อนไปลำดับถัดไป
    return {
      nextStep: currentStep + 1,
      nextStatus: "IN_REVIEW",
    };
  }

  return {
    nextStep: currentStep,
    nextStatus: "IN_REVIEW",
  };
}
