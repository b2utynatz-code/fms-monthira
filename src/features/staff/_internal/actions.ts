"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { STAFF_P } from "../permissions";
import { createStaffSchema, updateStaffSchema } from "./validations";
import { createFacultyMember, updateFacultyMember, deleteFacultyMember, listFacultyMembers, type FacultyMemberDto } from "./services";

export async function getFacultyMemberListAction(options?: { department?: string; isActive?: boolean }): Promise<ActionResult<FacultyMemberDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(STAFF_P.staffRead);
    return listFacultyMembers(ctx.tenantId, options);
  });
}

export async function createFacultyMemberAction(input: unknown): Promise<ActionResult<FacultyMemberDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(STAFF_P.staffManage);
    const parsed = createStaffSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createFacultyMember(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/staff");
    return result;
  });
}

export async function updateFacultyMemberAction(input: unknown): Promise<ActionResult<FacultyMemberDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(STAFF_P.staffManage);
    const parsed = updateStaffSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateFacultyMember(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/staff");
    return result;
  });
}

export async function deleteFacultyMemberAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(STAFF_P.staffManage);
    await deleteFacultyMember(ctx.tenantId, ctx.userId, id);
    revalidatePath("/staff");
  });
}

