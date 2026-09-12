import { AppError } from "@/shared/lib/errors";

export interface TranslateNewsInput {
  apiKey: string;
  model?: string;
  titleTh: string;
  summaryTh?: string;
  contentTh: string;
}

export interface TranslateNewsResult {
  titleEn: string;
  summaryEn: string;
  contentEn: string;
}

/**
 * แปลและสร้างเนื้อหาข่าวสารภาษาอังกฤษด้วย Google Gemini API
 */
export async function translateNewsWithGemini(input: TranslateNewsInput): Promise<TranslateNewsResult> {
  const model = input.model || "gemini-2.5-flash";
  const apiKey = input.apiKey.trim();

  if (!apiKey) {
    throw new AppError("validation", "ยังไม่ได้ตั้งค่า Google Gemini API Key กรุณาไปที่เมนู 'ตั้งค่าองค์กร' เพื่อระบุ API Key");
  }

  if (!input.titleTh?.trim() || !input.contentTh?.trim()) {
    throw new AppError("validation", "กรุณากรอกหัวข้อข่าวและเนื้อหาข่าวภาษาไทยก่อนให้ AI แปล");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const promptText = `
Translate the following Thai university news announcement into natural, accurate, and professional English.
- Provide a clear, compelling English title ('titleEn').
- If Thai summary is provided, translate it; if not provided or empty, craft an engaging 1-2 sentence English summary ('summaryEn') based on the content.
- Translate the full content into professional English ('contentEn') preserving all dates, names, contacts, and formatting structure.

Thai Content to translate:
Title (TH): ${input.titleTh}
Summary (TH): ${input.summaryTh || "(None provided)"}
Content (TH):
${input.contentTh}
`.trim();

  const payload = {
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
    systemInstruction: {
      parts: [
        {
          text: "You are an expert bilingual university communications specialist and translator. You translate Thai academic announcements and faculty news into elegant, professional English. You always reply with a JSON object matching this schema: {\"titleEn\": string, \"summaryEn\": string, \"contentEn\": string}.",
        },
      ],
    },
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (netErr: unknown) {
    const netMsg = netErr instanceof Error ? netErr.message : String(netErr);
    throw new AppError("validation", `ไม่สามารถเชื่อมต่อไปยัง Google Gemini API ได้: ${netMsg}`);
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMessage = (errData as { error?: { message?: string } })?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new AppError("validation", `Google Gemini API เกิดข้อผิดพลาด: ${errMessage}`);
  }

  const jsonResult = await response.json();
  const rawText = jsonResult?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText || typeof rawText !== "string") {
    throw new AppError("internal", "ไม่ได้รับคำตอบที่ถูกต้องจาก Gemini API");
  }

  try {
    // กำจัด code fences หากมี
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanedText) as { titleEn?: string; summaryEn?: string; contentEn?: string };

    return {
      titleEn: parsed.titleEn || input.titleTh,
      summaryEn: parsed.summaryEn || "",
      contentEn: parsed.contentEn || input.contentTh,
    };
  } catch {
    throw new AppError("internal", "รูปแบบข้อมูล JSON ที่ได้รับจาก Gemini ไม่ถูกต้อง");
  }
}
