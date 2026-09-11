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
});
