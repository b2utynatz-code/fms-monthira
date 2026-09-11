import { describe, it, expect } from "vitest";
import { createProgramSchema, updateProgramSchema } from "./validations";

describe("curriculum validations", () => {
  const validProgram = {
    code: "CS-2024",
    nameTh: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์",
    nameEn: "Bachelor of Science in Computer Science",
    degreeTh: "วท.บ. (วิทยาการคอมพิวเตอร์)",
    degreeEn: "B.Sc. (Computer Science)",
    degreeLevel: "BACHELOR" as const,
    department: "Computer Science",
    durationYears: 4,
    totalCredits: 130,
    tuitionFeePerTerm: 25000,
    careerPaths: ["Software Engineer", "Data Analyst"],
    admissionLink: "https://admission.example.ac.th",
    curriculumPdfUrl: "https://example.ac.th/docs/curriculum.pdf",
    descriptionTh: "หลักสูตรมาตรฐานสากล",
    descriptionEn: "International standard program",
    status: "ACTIVE" as const,
  };

  describe("createProgramSchema", () => {
    it("should accept valid curriculum data", () => {
      const result = createProgramSchema.safeParse(validProgram);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("CS-2024");
        expect(result.data.totalCredits).toBe(130);
        expect(result.data.degreeLevel).toBe("BACHELOR");
      }
    });

    it("should apply default values for degreeLevel, durationYears, careerPaths, and status", () => {
      const minimal = {
        code: "BA-2024",
        nameTh: "บริหารธุรกิจบัณฑิต",
        nameEn: "Bachelor of Business Administration",
        degreeTh: "บธ.บ.",
        degreeEn: "B.B.A.",
        department: "Management",
        totalCredits: 120,
      };

      const result = createProgramSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.degreeLevel).toBe("BACHELOR");
        expect(result.data.durationYears).toBe(4);
        expect(result.data.careerPaths).toEqual([]);
        expect(result.data.status).toBe("ACTIVE");
      }
    });

    it("should reject invalid degreeLevel", () => {
      const result = createProgramSchema.safeParse({
        ...validProgram,
        degreeLevel: "HIGH_SCHOOL",
      });
      expect(result.success).toBe(false);
    });

    it("should reject totalCredits <= 0", () => {
      const result = createProgramSchema.safeParse({
        ...validProgram,
        totalCredits: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject durationYears out of range (min 1, max 10)", () => {
      const tooLow = createProgramSchema.safeParse({
        ...validProgram,
        durationYears: 0,
      });
      expect(tooLow.success).toBe(false);

      const tooHigh = createProgramSchema.safeParse({
        ...validProgram,
        durationYears: 15,
      });
      expect(tooHigh.success).toBe(false);
    });

    it("should accept empty string for URLs or valid URLs", () => {
      const withEmptyUrls = createProgramSchema.safeParse({
        ...validProgram,
        admissionLink: "",
        curriculumPdfUrl: "",
      });
      expect(withEmptyUrls.success).toBe(true);

      const withInvalidUrl = createProgramSchema.safeParse({
        ...validProgram,
        admissionLink: "not-a-valid-url",
      });
      expect(withInvalidUrl.success).toBe(false);
    });
  });

  describe("updateProgramSchema", () => {
    it("should accept partial updates with a valid UUID", () => {
      const result = updateProgramSchema.safeParse({
        id: "a0000000-0000-4000-8000-000000000001",
        totalCredits: 135,
        status: "PHASING_OUT",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing or invalid id", () => {
      const missingId = updateProgramSchema.safeParse({
        totalCredits: 135,
      });
      expect(missingId.success).toBe(false);

      const invalidId = updateProgramSchema.safeParse({
        id: "not-a-uuid",
        totalCredits: 135,
      });
      expect(invalidId.success).toBe(false);
    });
  });
});
