"use server";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { updateSettingsSchema } from "../validations/settings";
import { getTenantSettings, updateTenantSettings, type TenantSettings } from "../services/tenant.service";

import path from "node:path";
import fs from "node:fs/promises";
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

