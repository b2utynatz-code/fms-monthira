import { describe, it, expect } from "vitest";
import {
  createDocumentRequestSchema,
  updateDocumentRequestSchema,
  processApprovalSchema,
  addAttachmentSchema,
} from "./validations";

describe("documents validations", () => {
  const dummyUuid = "123e4567-e89b-12d3-a456-426614174000";

  describe("createDocumentRequestSchema", () => {
    it("validates valid document input with defaults", () => {
      const valid = {
        title: "ขออนุมัติจัดโครงการอบรม AI",
        docType: "BUDGET_REQUEST" as const,
        priority: "URGENT" as const,
      };
      const parsed = createDocumentRequestSchema.parse(valid);
      expect(parsed.title).toBe("ขออนุมัติจัดโครงการอบรม AI");
      expect(parsed.docType).toBe("BUDGET_REQUEST");
      expect(parsed.priority).toBe("URGENT");
      expect(parsed.accessLevel).toBe("CONFIDENTIAL");
      expect(parsed.status).toBe("DRAFT");
    });

    it("fails when title is empty", () => {
      expect(() => createDocumentRequestSchema.parse({ title: "" })).toThrow();
    });
  });

  describe("updateDocumentRequestSchema", () => {
    it("requires uuid for id field", () => {
      const valid = {
        id: dummyUuid,
        title: "หัวข้อฉบับปรับปรุง",
      };
      const parsed = updateDocumentRequestSchema.parse(valid);
      expect(parsed.id).toBe(dummyUuid);
      expect(parsed.title).toBe("หัวข้อฉบับปรับปรุง");
    });

    it("throws on invalid uuid", () => {
      expect(() => updateDocumentRequestSchema.parse({ id: "invalid-uuid" })).toThrow();
    });
  });

  describe("processApprovalSchema", () => {
    it("accepts APPROVE action with comments", () => {
      const valid = {
        requestId: dummyUuid,
        action: "APPROVE" as const,
        comments: "เห็นชอบตามเสนอ",
      };
      const parsed = processApprovalSchema.parse(valid);
      expect(parsed.action).toBe("APPROVE");
      expect(parsed.comments).toBe("เห็นชอบตามเสนอ");
    });
  });

  describe("addAttachmentSchema", () => {
    it("validates file attachment correctly", () => {
      const valid = {
        requestId: dummyUuid,
        fileName: "budget-report.pdf",
        fileUrl: "https://example.com/files/budget.pdf",
        fileSize: 1024500,
        mimeType: "application/pdf",
      };
      const parsed = addAttachmentSchema.parse(valid);
      expect(parsed.fileName).toBe("budget-report.pdf");
      expect(parsed.fileSize).toBe(1024500);
    });
  });
});
