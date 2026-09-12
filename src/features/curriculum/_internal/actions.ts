"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "../permissions";
import {
  createProgramSchema,
  updateProgramSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./validations";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  listPrograms,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type AcademicProgramDto,
  type AcademicDepartmentDto,
} from "./services";

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

export async function getDepartmentListAction(): Promise<ActionResult<AcademicDepartmentDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    return listDepartments(ctx.tenantId);
  });
}

export async function createDepartmentAction(input: unknown): Promise<ActionResult<AcademicDepartmentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = createDepartmentSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createDepartment(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/curriculum");
    return result;
  });
}

export async function updateDepartmentAction(input: unknown): Promise<ActionResult<AcademicDepartmentDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = updateDepartmentSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateDepartment(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/curriculum");
    return result;
  });
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    await deleteDepartment(ctx.tenantId, ctx.userId, id);
    revalidatePath("/curriculum");
  });
}

