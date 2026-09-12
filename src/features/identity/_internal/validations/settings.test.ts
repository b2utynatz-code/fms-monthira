import { describe, it, expect } from "vitest";
import { updateSettingsSchema, orgStatementSchema } from "./settings";

describe("updateSettingsSchema", () => {
  it("should accept valid settings with empty logoUrl", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      logoUrl: "",
      palette: "blue",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logoUrl).toBe("");
    }
  });

  it("should accept valid settings with relative /uploads logoUrl", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      logoUrl: "/uploads/logos/tenant-123.png",
      palette: "green",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logoUrl).toBe("/uploads/logos/tenant-123.png");
    }
  });

  it("should accept valid settings with absolute https URL", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      logoUrl: "https://example.com/logo.webp",
      palette: "purple",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid logoUrl format", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      logoUrl: "javascript:alert(1)",
      palette: "blue",
    });
    expect(result.success).toBe(false);
  });

  it("should default logoUrl to empty string if omitted", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "pink",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logoUrl).toBe("");
    }
  });

  it("should accept valid smtp settings when enabled", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      smtp: {
        enabled: true,
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "admin@gmail.com",
        pass: "abcd efgh ijkl mnop",
        fromName: "คณะการจัดการ",
        fromEmail: "admin@gmail.com",
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject smtp settings when enabled but user email is invalid", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      smtp: {
        enabled: true,
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "not-an-email",
        pass: "abcd efgh ijkl mnop",
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept smtp settings with empty user when disabled", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      smtp: {
        enabled: false,
        user: "",
        pass: "",
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid contact settings", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      contact: {
        phone: "02-123-4567 ต่อ 100",
        email: "contact@fms.ac.th",
        addressTh: "123 ถนนมหาวิทยาลัย",
        addressEn: "123 University Ave",
        hoursTh: "จันทร์ – ศุกร์: 08:30 – 16:30 น.",
        hoursEn: "Mon – Fri: 08:30 – 16:30",
        facebook: "https://facebook.com/fms",
        line: "@fms",
        website: "https://fms.ac.th",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact?.phone).toBe("02-123-4567 ต่อ 100");
      expect(result.data.contact?.email).toBe("contact@fms.ac.th");
    }
  });

  it("should reject contact with invalid email", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      contact: {
        phone: "02-123-4567",
        email: "invalid-email-address",
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid gemini AI settings", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      gemini: {
        enabled: true,
        apiKey: "AIzaSyFakeKeyForTesting123",
        model: "gemini-2.5-flash",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gemini?.enabled).toBe(true);
      expect(result.data.gemini?.apiKey).toBe("AIzaSyFakeKeyForTesting123");
      expect(result.data.gemini?.model).toBe("gemini-2.5-flash");
    }
  });

  it("should default gemini model to gemini-2.5-flash if omitted", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      gemini: {
        enabled: true,
        apiKey: "AIzaSyFakeKey",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gemini?.model).toBe("gemini-2.5-flash");
    }
  });

  it("should accept valid world-standard organization statements", () => {
    const result = updateSettingsSchema.safeParse({
      nameTh: "คณะการจัดการ",
      nameEn: "Faculty of Management Sciences",
      palette: "blue",
      statement: {
        sloganTh: "มุ่งมั่นสู่ความเป็นเลิศทางวิชาการ",
        sloganEn: "Striving for Academic Excellence",
        visionTh: "เป็นสถาบันชั้นนำระดับสากล",
        visionEn: "To be a leading global institution",
        missionTh: "ผลิตบัณฑิตคุณภาพสูง",
        missionEn: "Produce high quality graduates",
        valuesTh: "คุณธรรมและนวัตกรรม",
        valuesEn: "Integrity and Innovation",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.statement?.sloganTh).toBe("มุ่งมั่นสู่ความเป็นเลิศทางวิชาการ");
      expect(result.data.statement?.sloganEn).toBe("Striving for Academic Excellence");
      expect(result.data.statement?.visionTh).toBe("เป็นสถาบันชั้นนำระดับสากล");
      expect(result.data.statement?.visionEn).toBe("To be a leading global institution");
    }
  });
});

describe("orgStatementSchema", () => {
  it("should parse with defaults when fields are omitted", () => {
    const result = orgStatementSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sloganTh).toBe("");
      expect(result.data.sloganEn).toBe("");
      expect(result.data.visionTh).toBe("");
      expect(result.data.visionEn).toBe("");
    }
  });

  it("should trim string values correctly", () => {
    const result = orgStatementSchema.safeParse({
      sloganTh: "   สโลแกน   ",
      sloganEn: "   Slogan   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sloganTh).toBe("สโลแกน");
      expect(result.data.sloganEn).toBe("Slogan");
    }
  });
});

