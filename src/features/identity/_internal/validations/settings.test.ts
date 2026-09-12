import { describe, it, expect } from "vitest";
import { updateSettingsSchema } from "./settings";

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
});

