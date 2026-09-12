import { cache } from "react";
import { prisma, type Db } from "@/shared/lib/infra/prisma";
import { DEFAULT_PALETTE, isPalette, type PaletteId } from "@/shared/lib/palette";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "../audit";
import type { UpdateSettingsInput } from "../validations/settings";

export interface SmtpSettings {
  enabled: boolean;
  service: "gmail" | "custom";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  hasPass: boolean;
  fromName: string;
  fromEmail: string;
}

export interface ContactSettings {
  phone: string;
  email: string;
  addressTh: string;
  addressEn: string;
  hoursTh: string;
  hoursEn: string;
  facebook?: string;
  line?: string;
  website?: string;
}

export interface GeminiClientSettings {
  enabled: boolean;
  apiKey: string;
  hasApiKey: boolean;
  model: string;
}

export interface GeminiRawSettings {
  enabled: boolean;
  apiKey: string;
  model: string;
}

export interface TenantSettings {
  code: string;
  nameTh: string;
  nameEn: string;
  logoUrl: string | null;
  palette: PaletteId;
  smtp?: SmtpSettings;
  contact?: ContactSettings;
  gemini?: GeminiClientSettings;
}

async function readTenantSettings(tenantId: string, db: Db): Promise<TenantSettings> {
  const t = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!t) throw errors.not_found();
  const raw = (t.settings as { palette?: unknown; smtp?: Partial<SmtpSettings>; contact?: Partial<ContactSettings>; gemini?: Partial<GeminiRawSettings> } | null) || {};
  const p = raw.palette;
  const rawSmtp = raw.smtp;
  const hasPass = Boolean(rawSmtp?.pass && rawSmtp.pass.length > 0);
  const smtp: SmtpSettings = {
    enabled: Boolean(rawSmtp?.enabled),
    service: rawSmtp?.service === "custom" ? "custom" : "gmail",
    host: rawSmtp?.host || "smtp.gmail.com",
    port: rawSmtp?.port || 587,
    secure: Boolean(rawSmtp?.secure),
    user: rawSmtp?.user || "",
    pass: "", // ไม่เปิดเผยรหัสผ่านจริงไปยัง client
    hasPass,
    fromName: rawSmtp?.fromName || "",
    fromEmail: rawSmtp?.fromEmail || "",
  };

  const rawContact = raw.contact;
  const contact: ContactSettings = {
    phone: rawContact?.phone ?? "02-123-4567 ต่อ 100-104",
    email: rawContact?.email ?? "contact@fms.ac.th",
    addressTh: rawContact?.addressTh ?? "คณะวิทยาการจัดการ 123 ถนนมหาวิทยาลัย แขวงในเมือง เขตเมือง กรุงเทพฯ 10000",
    addressEn: rawContact?.addressEn ?? "Faculty of Management Sciences, 123 University Avenue, Bangkok 10000",
    hoursTh: rawContact?.hoursTh ?? "จันทร์ – ศุกร์: 08:30 – 16:30 น.",
    hoursEn: rawContact?.hoursEn ?? "Mon – Fri: 08:30 – 16:30",
    facebook: rawContact?.facebook ?? "",
    line: rawContact?.line ?? "",
    website: rawContact?.website ?? "",
  };

  const rawGemini = raw.gemini;
  const envKey = process.env.GEMINI_API_KEY || "";
  const hasGeminiKey = Boolean((rawGemini?.apiKey && rawGemini.apiKey.length > 0) || (envKey && envKey.length > 0));
  const gemini: GeminiClientSettings = {
    enabled: rawGemini?.enabled ?? true,
    apiKey: "", // ไม่เปิดเผย API Key จริงไปยัง client
    hasApiKey: hasGeminiKey,
    model: rawGemini?.model || "gemini-2.5-flash",
  };

  return {
    code: t.code,
    nameTh: t.nameTh,
    nameEn: t.nameEn,
    logoUrl: t.logoUrl,
    palette: isPalette(p) ? p : DEFAULT_PALETTE,
    smtp,
    contact,
    gemini,
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  return readTenantSettings(tenantId, prisma);
}

/** ดึงข้อมูล SMTP พร้อมรหัสผ่านจริงสำหรับใช้ภายในเซิร์ฟเวอร์เท่านั้น (ส่งเมล / ทดสอบ) */
export async function getTenantRawSmtp(tenantId: string): Promise<SmtpSettings | null> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const raw = (t?.settings as { smtp?: Partial<SmtpSettings> } | null)?.smtp;
  if (!raw) return null;
  return {
    enabled: Boolean(raw.enabled),
    service: raw.service === "custom" ? "custom" : "gmail",
    host: raw.host || "smtp.gmail.com",
    port: raw.port || 587,
    secure: Boolean(raw.secure),
    user: raw.user || "",
    pass: raw.pass || "",
    hasPass: Boolean(raw.pass && raw.pass.length > 0),
    fromName: raw.fromName || "",
    fromEmail: raw.fromEmail || "",
  };
}

/** ดึงข้อมูล Gemini API Key พร้อมใช้จริงสำหรับเซิร์ฟเวอร์เท่านั้น (fallback ไปยัง process.env.GEMINI_API_KEY) */
export async function getTenantRawGemini(tenantId: string): Promise<GeminiRawSettings | null> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const raw = (t?.settings as { gemini?: Partial<GeminiRawSettings> } | null)?.gemini;
  const envKey = process.env.GEMINI_API_KEY || "";
  const apiKey = (raw?.apiKey && raw.apiKey.length > 0) ? raw.apiKey : envKey;
  if (!apiKey) return null;
  return {
    enabled: raw?.enabled ?? true,
    apiKey,
    model: raw?.model || "gemini-2.5-flash",
  };
}

/** เก็บคีย์อื่น ๆ ใน settings JSON ไว้ทั้งหมด — merge เฉพาะ palette, smtp, contact, gemini ที่เปลี่ยน ไม่ทับทั้งก้อน */
export async function updateTenantSettings(input: { tenantId: string; actorId: string } & UpdateSettingsInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await readTenantSettings(input.tenantId, tx);
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: input.tenantId }, select: { settings: true } });
    const existingSettings = (t.settings as { palette?: unknown; smtp?: Partial<SmtpSettings>; gemini?: Partial<GeminiRawSettings> } | null) || {};

    let newSmtp = existingSettings.smtp;
    if (input.smtp) {
      // ถ้ารหัสผ่านส่งมาว่าง ให้ใช้รหัสเดิมที่เคยบันทึกไว้ในฐานข้อมูล
      const rawPass = input.smtp.pass?.trim();
      const pass = rawPass ? rawPass.replace(/\s+/g, "") : (existingSettings.smtp?.pass || "");
      newSmtp = {
        enabled: input.smtp.enabled,
        service: input.smtp.service,
        host: input.smtp.host,
        port: input.smtp.port,
        secure: input.smtp.secure,
        user: input.smtp.user.trim(),
        pass,
        fromName: input.smtp.fromName.trim(),
        fromEmail: input.smtp.fromEmail.trim(),
      };
    }

    let newGemini = existingSettings.gemini;
    if (input.gemini) {
      const rawKey = input.gemini.apiKey?.trim();
      const apiKey = rawKey ? rawKey : (existingSettings.gemini?.apiKey || "");
      newGemini = {
        enabled: input.gemini.enabled,
        apiKey,
        model: input.gemini.model || "gemini-2.5-flash",
      };
    }

    const newSettings = {
      ...existingSettings,
      palette: input.palette,
      ...(newSmtp ? { smtp: newSmtp } : {}),
      ...(input.contact ? { contact: input.contact } : {}),
      ...(newGemini ? { gemini: newGemini } : {}),
    };

    await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        logoUrl: input.logoUrl || null,
        settings: newSettings,
      },
    });

    const auditAfter = {
      ...input,
      smtp: input.smtp ? { ...input.smtp, pass: input.smtp.pass ? "******" : undefined } : undefined,
    };
    await writeAudit({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "tenant.settings_update",
      entity: "tenant",
      entityId: input.tenantId,
      before,
      after: auditAfter,
    }, tx);
  });
}

export async function getTenantPalette(tenantId: string): Promise<PaletteId> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const p = (t?.settings as { palette?: unknown } | null)?.palette;
  return isPalette(p) ? p : DEFAULT_PALETTE;
}

/**
 * tenant ของ session ถ้ามี — import แบบ dynamic เพราะ `../auth` ดึง next-auth ทั้งก้อนเข้ามา และ
 * โมดูลนี้ถูก import จาก root layout ที่รันทุก request · แยก try ของตัวเองไว้ต่างหากโดยเจตนา: เดิมมันอยู่
 * ใน try เดียวกับการอ่านฐานข้อมูล ทำให้ "โหลด auth ไม่ได้" กับ "ฐานข้อมูลล้ม" กลืนหายไปเป็นค่าเดียวกัน
 * และเส้นทางอ่าน tenant ทั้งเส้นทดสอบไม่ได้เลย (ในสภาพแวดล้อมเทสต์ next-auth resolve ไม่ผ่าน)
 */
async function sessionTenantId(): Promise<string | null> {
  try {
    const { auth } = await import("../auth");
    return (await auth())?.tenantId || null;
  } catch {
    return null;
  }
}

/** ใช้โดย root layout ทุก request — tenant จาก session ถ้ามี ไม่งั้น tenant แรก (หน้า login ยังไม่มี session) · ไม่ throw */
export const resolvePalette = cache(async (): Promise<PaletteId> => {
  try {
    const sessionTid = await sessionTenantId();
    if (sessionTid) {
      try {
        return await getTenantPalette(sessionTid);
      } catch {
        // stale session tenantId
      }
    }
    const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    return defaultTenant ? await getTenantPalette(defaultTenant.id) : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
});

/** ดึงการตั้งค่า tenant สำหรับ layout (โลโก้, ชื่อองค์กร, โทนสี) — ไม่ throw */
export const resolveTenantSettings = cache(async (): Promise<TenantSettings | null> => {
  try {
    const sessionTid = await sessionTenantId();
    if (sessionTid) {
      try {
        return await readTenantSettings(sessionTid, prisma);
      } catch {
        // stale session tenantId, fallback to default tenant
      }
    }
    const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!defaultTenant) return null;
    return await readTenantSettings(defaultTenant.id, prisma);
  } catch {
    return null;
  }
});

