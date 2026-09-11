import { describe, it, expect } from "vitest";
import { createNewsSchema, updateNewsSchema } from "./validations";
import { generateSlug } from "./services";

describe("news validations & logic", () => {
  const dummyUuid = "123e4567-e89b-12d3-a456-426614174000";

  describe("createNewsSchema", () => {
    it("validates valid news input with default category and status", () => {
      const valid = {
        titleTh: "เปิดรับสมัครนักศึกษาใหม่ 2569",
        titleEn: "Admissions 2026",
        contentTh: "รายละเอียดการรับสมัครนักศึกษา...",
      };
      const parsed = createNewsSchema.parse(valid);
      expect(parsed.titleTh).toBe("เปิดรับสมัครนักศึกษาใหม่ 2569");
      expect(parsed.category).toBe("ANNOUNCEMENT");
      expect(parsed.status).toBe("DRAFT");
      expect(parsed.isPinned).toBe(false);
    });

    it("throws when titleTh or titleEn or contentTh is empty", () => {
      expect(() => createNewsSchema.parse({ titleTh: "", titleEn: "English", contentTh: "Content" })).toThrow();
      expect(() => createNewsSchema.parse({ titleTh: "Thai", titleEn: "", contentTh: "Content" })).toThrow();
      expect(() => createNewsSchema.parse({ titleTh: "Thai", titleEn: "English", contentTh: "" })).toThrow();
    });

    it("accepts valid category and published status", () => {
      const valid = {
        titleTh: "วิจัยดีเด่น",
        titleEn: "Outstanding Research",
        contentTh: "เนื้อหางานวิจัย",
        category: "RESEARCH" as const,
        status: "PUBLISHED" as const,
        coverImageUrl: "https://example.com/cover.jpg",
      };
      const parsed = createNewsSchema.parse(valid);
      expect(parsed.category).toBe("RESEARCH");
      expect(parsed.status).toBe("PUBLISHED");
      expect(parsed.coverImageUrl).toBe("https://example.com/cover.jpg");
    });
  });

  describe("updateNewsSchema", () => {
    it("requires uuid for id", () => {
      const valid = {
        id: dummyUuid,
        titleTh: "หัวข้อข่าวปรับปรุง",
      };
      const parsed = updateNewsSchema.parse(valid);
      expect(parsed.id).toBe(dummyUuid);
      expect(parsed.titleTh).toBe("หัวข้อข่าวปรับปรุง");
    });

    it("throws on invalid uuid", () => {
      expect(() => updateNewsSchema.parse({ id: "invalid-id" })).toThrow();
    });
  });

  describe("generateSlug", () => {
    it("generates a clean slug from English title", () => {
      const slug = generateSlug("AI & Business Innovation Conference 2026!");
      expect(slug).toMatch(/^ai-business-innovation-conference-2026-[a-z0-9]+$/);
    });

    it("handles fallback if input has only special characters", () => {
      const slug = generateSlug("!@#$%^&*()");
      expect(slug).toMatch(/^news-[a-z0-9]+$/);
    });
  });
});
