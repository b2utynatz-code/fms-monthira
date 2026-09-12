"use server";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { updateSettingsSchema, testSmtpSchema } from "../validations/settings";
import { getTenantSettings, updateTenantSettings, getTenantRawSmtp, type TenantSettings } from "../services/tenant.service";

import path from "node:path";
import fs from "node:fs/promises";
import nodemailer from "nodemailer";
import { AppError } from "@/shared/lib/errors";

export async function getSettingsAction(): Promise<ActionResult<TenantSettings>> {
  return runAction(async () => getTenantSettings((await requirePermission(P.settingsManage)).tenantId));
}
export async function updateSettingsAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    await updateTenantSettings({ tenantId: ctx.tenantId, actorId: ctx.userId, ...updateSettingsSchema.parse(input, { error: zodErrorMap(await getLocale()) }) });
    revalidatePath("/", "layout"); // data-palette บน <html> อ่านใหม่
  });
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      throw new AppError("validation", "กรุณาเลือกไฟล์รูปภาพ");
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      throw new AppError("validation", "ขนาดไฟล์ต้องไม่เกิน 2MB");
    }

    const ALLOWED_TYPES: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      throw new AppError("validation", "รองรับเฉพาะไฟล์รูปภาพ PNG, JPG, WEBP หรือ SVG เท่านั้น");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${ctx.tenantId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    return { url: `/uploads/logos/${filename}` };
  });
}

export async function testSmtpAction(input: unknown): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    const parsed = testSmtpSchema.parse(input, { error: zodErrorMap(await getLocale()) });

    let pass = parsed.smtp.pass?.trim();
    if (!pass) {
      const saved = await getTenantRawSmtp(ctx.tenantId);
      pass = saved?.pass || "";
    }
    if (!pass) {
      throw new AppError("validation", "กรุณากรอกรหัสผ่านแอป (Google App Password) ก่อนทดสอบ");
    }

    const cleanPass = pass.replace(/\s+/g, "");
    const transport = nodemailer.createTransport({
      host: parsed.smtp.host,
      port: parsed.smtp.port,
      secure: parsed.smtp.secure,
      auth: {
        user: parsed.smtp.user,
        pass: cleanPass,
      },
    });

    try {
      await transport.verify();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new AppError("validation", `เชื่อมต่อ SMTP ล้มเหลว: ${msg}`);
    }

    const fromAddress = parsed.smtp.fromEmail || parsed.smtp.user;
    const fromName = parsed.smtp.fromName || "FMS System";

    try {
      await transport.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: parsed.toEmail,
        subject: "[FMS] ทดสอบการเชื่อมต่อ SMTP Gmail สำเร็จ / SMTP Test Connection Succeeded",
        text: `สวัสดี,\n\nนี่คืออีเมลทดสอบจากระบบ FMS เพื่อยืนยันว่าการตั้งค่า SMTP Gmail ทำงานได้อย่างถูกต้อง\n\nเวลาส่ง: ${new Date().toLocaleString("th-TH")}\nHost: ${parsed.smtp.host}:${parsed.smtp.port}\nSender: ${fromAddress}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0284c7; margin-top: 0;">ทดสอบการเชื่อมต่อ SMTP Gmail สำเร็จ</h2>
            <p>นี่คืออีเมลทดสอบจากระบบ <strong>FMS</strong> เพื่อยืนยันว่าการตั้งค่า SMTP Gmail ทำงานได้อย่างถูกต้องเรียบร้อยแล้ว</p>
            <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 6px; font-size: 14px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>ผู้ส่ง:</strong> ${fromName} &lt;${fromAddress}&gt;</p>
              <p style="margin: 4px 0;"><strong>เซิร์ฟเวอร์:</strong> ${parsed.smtp.host}:${parsed.smtp.port}</p>
              <p style="margin: 4px 0;"><strong>เวลาส่ง:</strong> ${new Date().toLocaleString("th-TH")}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">หากคุณได้รับอีเมลนี้ แสดงว่าระบบสามารถส่งการแจ้งเตือนและลิงก์ตั้งรหัสผ่านผ่าน Gmail ได้อย่างสมบูรณ์</p>
          </div>
        `,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new AppError("validation", `ส่งอีเมลทดสอบล้มเหลว: ${msg}`);
    }

    return { success: true };
  });
}

