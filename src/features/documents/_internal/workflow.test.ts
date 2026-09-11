import { describe, it, expect } from "vitest";
import {
  generateTrackingCode,
  generateDocNumber,
  evaluateWorkflowTransition,
} from "./workflow";

describe("document workflow helpers", () => {
  describe("generateTrackingCode", () => {
    it("should start with TRK- and have length of 10", () => {
      const code = generateTrackingCode();
      expect(code).toMatch(/^TRK-[A-HJ-NP-Z2-9]{6}$/);
    });

    it("should generate distinct codes on subsequent calls", () => {
      const code1 = generateTrackingCode();
      const code2 = generateTrackingCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe("generateDocNumber", () => {
    it("should format doc number with year and 4-digit zero-padded sequence", () => {
      expect(generateDocNumber(0, 2026)).toBe("DOC-2026-0001");
      expect(generateDocNumber(9, 2026)).toBe("DOC-2026-0010");
      expect(generateDocNumber(99, 2026)).toBe("DOC-2026-0100");
      expect(generateDocNumber(999, 2026)).toBe("DOC-2026-1000");
    });
  });

  describe("evaluateWorkflowTransition", () => {
    it("should reject workflow immediately regardless of current step", () => {
      const result = evaluateWorkflowTransition({
        currentStep: 1,
        totalSteps: 3,
        action: "REJECT",
      });
      expect(result).toEqual({
        nextStep: 1,
        nextStatus: "REJECTED",
      });
    });

    it("should return workflow to requester for correction", () => {
      const result = evaluateWorkflowTransition({
        currentStep: 2,
        totalSteps: 3,
        action: "RETURN",
      });
      expect(result).toEqual({
        nextStep: 2,
        nextStatus: "RETURNED",
      });
    });

    it("should advance to next step and keep IN_REVIEW if not final step", () => {
      const result = evaluateWorkflowTransition({
        currentStep: 1,
        totalSteps: 3,
        action: "APPROVE",
      });
      expect(result).toEqual({
        nextStep: 2,
        nextStatus: "IN_REVIEW",
      });

      const forwardResult = evaluateWorkflowTransition({
        currentStep: 2,
        totalSteps: 3,
        action: "FORWARD",
      });
      expect(forwardResult).toEqual({
        nextStep: 3,
        nextStatus: "IN_REVIEW",
      });
    });

    it("should transition to APPROVED when final step approves", () => {
      const result = evaluateWorkflowTransition({
        currentStep: 3,
        totalSteps: 3,
        action: "APPROVE",
      });
      expect(result).toEqual({
        nextStep: 3,
        nextStatus: "APPROVED",
      });
    });

    it("should handle single-step workflow approval immediately", () => {
      const result = evaluateWorkflowTransition({
        currentStep: 1,
        totalSteps: 1,
        action: "APPROVE",
      });
      expect(result).toEqual({
        nextStep: 1,
        nextStatus: "APPROVED",
      });
    });
  });
});
