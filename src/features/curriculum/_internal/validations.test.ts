import { describe, it, expect } from "vitest";
import {
  createProgramSchema,
  updateProgramSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./validations";


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

  describe("createDepartmentSchema", () => {
    const validDept = {
      code: "CS",
      nameTh: "ภาควิชาวิทยาการคอมพิวเตอร์",
      nameEn: "Department of Computer Science",
      descriptionTh: "หลักสูตรทางด้านวิทยาศาสตร์คอมพิวเตอร์",
      headNameTh: "ผศ.ดร. กิตติพงษ์ สิทธิศาสตร์",
      contactEmail: "cs@fms.ac.th",
      contactPhone: "02-123-4567",
      officeLocation: "อาคาร 4 ชั้น 3",
      orderIndex: 1,
      isActive: true,
    };

    it("should accept valid department data", () => {
      const result = createDepartmentSchema.safeParse(validDept);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("CS");
        expect(result.data.nameTh).toBe("ภาควิชาวิทยาการคอมพิวเตอร์");
      }
    });

    it("should apply default values for orderIndex and isActive", () => {
      const minimal = {
        code: "IT",
        nameTh: "ภาควิชาระบบสารสนเทศ",
        nameEn: "Department of Information Systems",
      };
      const result = createDepartmentSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.orderIndex).toBe(0);
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should reject empty code or nameTh", () => {
      const emptyCode = createDepartmentSchema.safeParse({ ...validDept, code: "" });
      expect(emptyCode.success).toBe(false);

      const emptyNameTh = createDepartmentSchema.safeParse({ ...validDept, nameTh: "" });
      expect(emptyNameTh.success).toBe(false);
    });

    it("should validate email format if provided", () => {
      const invalidEmail = createDepartmentSchema.safeParse({ ...validDept, contactEmail: "invalid-email" });
      expect(invalidEmail.success).toBe(false);

      const emptyEmail = createDepartmentSchema.safeParse({ ...validDept, contactEmail: "" });
      expect(emptyEmail.success).toBe(true);
    });
  });

  describe("updateDepartmentSchema", () => {
    it("should accept partial updates with valid UUID", () => {
      const result = updateDepartmentSchema.safeParse({
        id: "a0000000-0000-4000-8000-000000000001",
        nameTh: "ภาควิชาวิทยาการคอมพิวเตอร์และปัญญาประดิษฐ์",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = updateDepartmentSchema.safeParse({
        id: "invalid-id",
        nameTh: "ทดสอบ",
      });
      expect(result.success).toBe(false);
    });
  });
});

