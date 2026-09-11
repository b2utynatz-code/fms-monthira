"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "../permissions";
import { createProgramSchema, updateProgramSchema } from "./validations";
import { createProgram, updateProgram, deleteProgram, listPrograms, type AcademicProgramDto } from "./services";

export async function getProgramListAction(options?: { degreeLevel?: string; status?: string }): Promise<ActionResult<AcademicProgramDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    return listPrograms(ctx.tenantId, options);
  });
}

export async function createProgramAction(input: unknown): Promise<ActionResult<AcademicProgramDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = createProgramSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createProgram(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/curriculum");
    return result;
  });
}

export async function updateProgramAction(input: unknown): Promise<ActionResult<AcademicProgramDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = updateProgramSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateProgram(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/curriculum");
    return result;
  });
}

export async function deleteProgramAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    await deleteProgram(ctx.tenantId, ctx.userId, id);
    revalidatePath("/curriculum");
  });
}

