import { describe, it, expect } from "vitest";
import { createStaffSchema, updateStaffSchema } from "./validations";

describe("staff validations", () => {
  const dummyUuid = "123e4567-e89b-12d3-a456-426614174000";

  describe("createStaffSchema", () => {
    it("validates valid faculty member input with defaults", () => {
      const valid = {
        titleTh: "ผศ.ดร.",
        titleEn: "Asst. Prof. Dr.",
        firstNameTh: "สมชาย",
        lastNameTh: "ใจดี",
        firstNameEn: "Somchai",
        lastNameEn: "Jaidee",
        department: "ภาควิชาวิทยาการคอมพิวเตอร์",
        email: "somchai.j@fms.ac.th",
      };
      const parsed = createStaffSchema.parse(valid);
      expect(parsed.firstNameTh).toBe("สมชาย");
      expect(parsed.academicPosition).toBe("LECTURER");
      expect(parsed.orderIndex).toBe(0);
      expect(parsed.isActive).toBe(true);
      expect(parsed.expertise).toEqual([]);
    });

    it("throws on invalid email address format", () => {
      const invalid = {
        titleTh: "อ.",
        titleEn: "Lect.",
        firstNameTh: "สมชาย",
        lastNameTh: "ใจดี",
        firstNameEn: "Somchai",
        lastNameEn: "Jaidee",
        department: "ภาควิชาวิทยาการคอมพิวเตอร์",
        email: "not-an-email",
      };
      expect(() => createStaffSchema.parse(invalid)).toThrow("อีเมลไม่ถูกต้อง");
    });

    it("accepts valid academic position and expertise list", () => {
      const valid = {
        titleTh: "ศ.ดร.",
        titleEn: "Prof. Dr.",
        firstNameTh: "วิรัช",
        lastNameTh: "ตั้งมั่น",
        firstNameEn: "Wirat",
        lastNameEn: "Tangman",
        academicPosition: "PROFESSOR" as const,
        adminPositionTh: "คณบดี",
        adminPositionEn: "Dean",
        department: "ภาควิชาระบบสารสนเทศ",
        email: "wirat@fms.ac.th",
        expertise: ["Artificial Intelligence", "Machine Learning"],
        orderIndex: 1,
      };
      const parsed = createStaffSchema.parse(valid);
      expect(parsed.academicPosition).toBe("PROFESSOR");
      expect(parsed.adminPositionTh).toBe("คณบดี");
      expect(parsed.expertise).toHaveLength(2);
    });
  });

  describe("updateStaffSchema", () => {
    it("validates partial update with valid uuid", () => {
      const valid = {
        id: dummyUuid,
        phoneExt: "1025",
        roomNumber: "402B",
      };
      const parsed = updateStaffSchema.parse(valid);
      expect(parsed.id).toBe(dummyUuid);
      expect(parsed.phoneExt).toBe("1025");
      expect(parsed.roomNumber).toBe("402B");
    });

    it("throws when id is not a valid uuid", () => {
      expect(() => updateStaffSchema.parse({ id: "bad-id" })).toThrow();
    });
  });
});
