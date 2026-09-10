import { prisma } from "@/shared/lib/infra/prisma";
import type { DegreeLevel, ProgramStatus } from "@/generated/prisma";
import type { CreateProgramInput, UpdateProgramInput } from "./validations";

export interface AcademicProgramDto {
  id: string;
  tenantId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  degreeTh: string;
  degreeEn: string;
  degreeLevel: DegreeLevel;
  department: string;
  durationYears: number;
  totalCredits: number;
  tuitionFeePerTerm: number | null;
  careerPaths: string[];
  admissionLink: string | null;
  curriculumPdfUrl: string | null;
  descriptionTh: string | null;
  descriptionEn: string | null;
  status: ProgramStatus;
  createdAt: string;
  updatedAt: string;
}

export async function listPrograms(tenantId: string, options?: { degreeLevel?: string; status?: string }): Promise<AcademicProgramDto[]> {
  const items = await prisma.academicProgram.findMany({
    where: {
      tenantId,
      ...(options?.degreeLevel ? { degreeLevel: options.degreeLevel as DegreeLevel } : {}),
      ...(options?.status ? { status: options.status as ProgramStatus } : {}),
    },
    orderBy: [{ degreeLevel: "asc" }, { code: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    code: item.code,
    nameTh: item.nameTh,
    nameEn: item.nameEn,
    degreeTh: item.degreeTh,
    degreeEn: item.degreeEn,
    degreeLevel: item.degreeLevel,
    department: item.department,
    durationYears: item.durationYears,
    totalCredits: item.totalCredits,
    tuitionFeePerTerm: item.tuitionFeePerTerm ? Number(item.tuitionFeePerTerm) : null,
    careerPaths: Array.isArray(item.careerPaths) ? (item.careerPaths as string[]) : [],
    admissionLink: item.admissionLink,
    curriculumPdfUrl: item.curriculumPdfUrl,
    descriptionTh: item.descriptionTh,
    descriptionEn: item.descriptionEn,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function getProgramById(tenantId: string, id: string): Promise<AcademicProgramDto | null> {
  const item = await prisma.academicProgram.findUnique({
    where: { id },
  });
  if (!item || item.tenantId !== tenantId) return null;

  return {
    id: item.id,
    tenantId: item.tenantId,
    code: item.code,
    nameTh: item.nameTh,
    nameEn: item.nameEn,
    degreeTh: item.degreeTh,
    degreeEn: item.degreeEn,
    degreeLevel: item.degreeLevel,
    department: item.department,
    durationYears: item.durationYears,
    totalCredits: item.totalCredits,
    tuitionFeePerTerm: item.tuitionFeePerTerm ? Number(item.tuitionFeePerTerm) : null,
    careerPaths: Array.isArray(item.careerPaths) ? (item.careerPaths as string[]) : [],
    admissionLink: item.admissionLink,
    curriculumPdfUrl: item.curriculumPdfUrl,
    descriptionTh: item.descriptionTh,
    descriptionEn: item.descriptionEn,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function createProgram(tenantId: string, input: CreateProgramInput): Promise<AcademicProgramDto> {
  const created = await prisma.academicProgram.create({
    data: {
      tenantId,
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      degreeTh: input.degreeTh,
      degreeEn: input.degreeEn,
      degreeLevel: input.degreeLevel,
      department: input.department,
      durationYears: input.durationYears,
      totalCredits: input.totalCredits,
      tuitionFeePerTerm: input.tuitionFeePerTerm ?? null,
      careerPaths: input.careerPaths,
      admissionLink: input.admissionLink || null,
      curriculumPdfUrl: input.curriculumPdfUrl || null,
      descriptionTh: input.descriptionTh || null,
      descriptionEn: input.descriptionEn || null,
      status: input.status,
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    code: created.code,
    nameTh: created.nameTh,
    nameEn: created.nameEn,
    degreeTh: created.degreeTh,
    degreeEn: created.degreeEn,
    degreeLevel: created.degreeLevel,
    department: created.department,
    durationYears: created.durationYears,
    totalCredits: created.totalCredits,
    tuitionFeePerTerm: created.tuitionFeePerTerm ? Number(created.tuitionFeePerTerm) : null,
    careerPaths: Array.isArray(created.careerPaths) ? (created.careerPaths as string[]) : [],
    admissionLink: created.admissionLink,
    curriculumPdfUrl: created.curriculumPdfUrl,
    descriptionTh: created.descriptionTh,
    descriptionEn: created.descriptionEn,
    status: created.status,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateProgram(tenantId: string, input: UpdateProgramInput): Promise<AcademicProgramDto> {
  const updated = await prisma.academicProgram.update({
    where: { id: input.id, tenantId },
    data: {
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      degreeTh: input.degreeTh,
      degreeEn: input.degreeEn,
      degreeLevel: input.degreeLevel,
      department: input.department,
      durationYears: input.durationYears,
      totalCredits: input.totalCredits,
      tuitionFeePerTerm: input.tuitionFeePerTerm,
      careerPaths: input.careerPaths,
      admissionLink: input.admissionLink || null,
      curriculumPdfUrl: input.curriculumPdfUrl || null,
      descriptionTh: input.descriptionTh,
      descriptionEn: input.descriptionEn,
      status: input.status,
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    code: updated.code,
    nameTh: updated.nameTh,
    nameEn: updated.nameEn,
    degreeTh: updated.degreeTh,
    degreeEn: updated.degreeEn,
    degreeLevel: updated.degreeLevel,
    department: updated.department,
    durationYears: updated.durationYears,
    totalCredits: updated.totalCredits,
    tuitionFeePerTerm: updated.tuitionFeePerTerm ? Number(updated.tuitionFeePerTerm) : null,
    careerPaths: Array.isArray(updated.careerPaths) ? (updated.careerPaths as string[]) : [],
    admissionLink: updated.admissionLink,
    curriculumPdfUrl: updated.curriculumPdfUrl,
    descriptionTh: updated.descriptionTh,
    descriptionEn: updated.descriptionEn,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteProgram(tenantId: string, id: string): Promise<void> {
  await prisma.academicProgram.delete({
    where: { id, tenantId },
  });
}
