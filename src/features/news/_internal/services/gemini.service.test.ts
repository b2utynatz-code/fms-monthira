import { describe, it, expect, vi, beforeEach } from "vitest";
import { translateNewsWithGemini } from "./gemini.service";

describe("translateNewsWithGemini", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw error if apiKey is empty", async () => {
    await expect(
      translateNewsWithGemini({
        apiKey: "",
        titleTh: "หัวข้อข่าว",
        contentTh: "เนื้อหาข่าว",
      }),
    ).rejects.toThrow(/Google Gemini API Key/);
  });

  it("should throw error if titleTh or contentTh is empty", async () => {
    await expect(
      translateNewsWithGemini({
        apiKey: "fake-key",
        titleTh: "",
        contentTh: "เนื้อหาข่าว",
      }),
    ).rejects.toThrow(/ภาษาไทย/);
  });

  it("should parse valid Gemini JSON response successfully", async () => {
    const mockGeminiReply = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  titleEn: "Annual Academic Conference 2026",
                  summaryEn: "Faculty organizes academic conference.",
                  contentEn: "Full details of the conference.",
                }),
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGeminiReply,
    } as unknown as Response);

    const result = await translateNewsWithGemini({
      apiKey: "fake-key",
      titleTh: "การประชุมวิชาการประจำปี 2569",
      summaryTh: "คณะจัดประชุมวิชาการ",
      contentTh: "รายละเอียดการจัดประชุมวิชาการ...",
    });

    expect(result.titleEn).toBe("Annual Academic Conference 2026");
    expect(result.summaryEn).toBe("Faculty organizes academic conference.");
    expect(result.contentEn).toBe("Full details of the conference.");
  });

  it("should handle markdown-wrapped JSON response from Gemini", async () => {
    const rawMarkdown = "```json\n" + JSON.stringify({
      titleEn: "Cleaned Title",
      summaryEn: "Cleaned Summary",
      contentEn: "Cleaned Content",
    }) + "\n```";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: rawMarkdown }],
            },
          },
        ],
      }),
    } as unknown as Response);

    const result = await translateNewsWithGemini({
      apiKey: "fake-key",
      titleTh: "หัวข้อ",
      contentTh: "เนื้อหา",
    });

    expect(result.titleEn).toBe("Cleaned Title");
    expect(result.summaryEn).toBe("Cleaned Summary");
    expect(result.contentEn).toBe("Cleaned Content");
  });

  it("should handle API HTTP errors gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        error: { message: "API key not valid. Please pass a valid API key." },
      }),
    } as unknown as Response);

    await expect(
      translateNewsWithGemini({
        apiKey: "invalid-key",
        titleTh: "หัวข้อ",
        contentTh: "เนื้อหา",
      }),
    ).rejects.toThrow(/API key not valid/);
  });
});
