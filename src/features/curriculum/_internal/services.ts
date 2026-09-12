import { prisma } from "@/shared/lib/infra/prisma";
import type { DegreeLevel, ProgramStatus } from "@/generated/prisma";
import type {
  CreateProgramInput,
  UpdateProgramInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./validations";

export interface AcademicProgramDto {
  id: string;
  tenantId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  degreeTh: string;
  degreeEn: string;
  degreeLevel: DegreeLevel;
  departmentId: string | null;
  department: string;
  departmentNameTh?: string;
  departmentNameEn?: string;
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

export interface AcademicDepartmentDto {
  id: string;
  tenantId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string | null;
  descriptionEn: string | null;
  headNameTh: string | null;
  headNameEn: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  officeLocation: string | null;
  orderIndex: number;
  isActive: boolean;
  programsCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function listPrograms(
  tenantId: string,
  options?: { degreeLevel?: string; status?: string; departmentId?: string }
): Promise<AcademicProgramDto[]> {
  const items = await prisma.academicProgram.findMany({
    where: {
      tenantId,
      ...(options?.degreeLevel ? { degreeLevel: options.degreeLevel as DegreeLevel } : {}),
      ...(options?.status ? { status: options.status as ProgramStatus } : {}),
      ...(options?.departmentId ? { departmentId: options.departmentId } : {}),
    },
    include: {
      departmentRef: {
        select: { id: true, nameTh: true, nameEn: true },
      },
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
    departmentId: item.departmentId,
    department: item.department,
    departmentNameTh: item.departmentRef?.nameTh || item.department,
    departmentNameEn: item.departmentRef?.nameEn || "",
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
    include: {
      departmentRef: {
        select: { id: true, nameTh: true, nameEn: true },
      },
    },
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
    departmentId: item.departmentId,
    department: item.department,
    departmentNameTh: item.departmentRef?.nameTh || item.department,
    departmentNameEn: item.departmentRef?.nameEn || "",
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

export async function createProgram(
  tenantId: string,
  actorId: string,
  input: CreateProgramInput
): Promise<AcademicProgramDto> {
  const created = await prisma.$transaction(async (tx) => {
    let departmentName = input.department || "";
    if (input.departmentId) {
      const dept = await tx.academicDepartment.findUnique({
        where: { id: input.departmentId, tenantId },
      });
      if (dept) {
        departmentName = dept.nameTh;
      }
    }

    const item = await tx.academicProgram.create({
      data: {
        tenantId,
        code: input.code,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        degreeTh: input.degreeTh,
        degreeEn: input.degreeEn,
        degreeLevel: input.degreeLevel,
        departmentId: input.departmentId ?? null,
        department: departmentName,
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

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "curriculum.create",
        entity: "academic_program",
        entityId: item.id,
        after: { code: item.code, nameTh: item.nameTh, degreeLevel: item.degreeLevel },
      },
    });

    return item;
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
    departmentId: created.departmentId,
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

export async function updateProgram(
  tenantId: string,
  actorId: string,
  input: UpdateProgramInput
): Promise<AcademicProgramDto> {
  const updated = await prisma.$transaction(async (tx) => {
    let departmentName = input.department;
    if (input.departmentId) {
      const dept = await tx.academicDepartment.findUnique({
        where: { id: input.departmentId, tenantId },
      });
      if (dept) {
        departmentName = dept.nameTh;
      }
    }

    const item = await tx.academicProgram.update({
      where: { id: input.id, tenantId },
      data: {
        code: input.code,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        degreeTh: input.degreeTh,
        degreeEn: input.degreeEn,
        degreeLevel: input.degreeLevel,
        departmentId: input.departmentId !== undefined ? input.departmentId : undefined,
        department: departmentName,
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

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "curriculum.update",
        entity: "academic_program",
        entityId: item.id,
        after: { code: item.code, nameTh: item.nameTh, status: item.status },
      },
    });

    return item;
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
    departmentId: updated.departmentId,
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

export async function deleteProgram(tenantId: string, actorId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.academicProgram.findUnique({
      where: { id, tenantId },
      select: { code: true, nameTh: true },
    });

    await tx.academicProgram.delete({
      where: { id, tenantId },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "curriculum.delete",
        entity: "academic_program",
        entityId: id,
        before: existing ? { code: existing.code, nameTh: existing.nameTh } : undefined,
      },
    });
  });
}

// ─────────────────────────────────────────────────────────
// Academic Department Services (บริหารจัดการภาควิชา/ส่วนงาน)
// ─────────────────────────────────────────────────────────

export async function listDepartments(tenantId: string): Promise<AcademicDepartmentDto[]> {
  const items = await prisma.academicDepartment.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { programs: true },
      },
    },
    orderBy: [{ orderIndex: "asc" }, { code: "asc" }],
  });

  return items.map((d) => ({
    id: d.id,
    tenantId: d.tenantId,
    code: d.code,
    nameTh: d.nameTh,
    nameEn: d.nameEn,
    descriptionTh: d.descriptionTh,
    descriptionEn: d.descriptionEn,
    headNameTh: d.headNameTh,
    headNameEn: d.headNameEn,
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone,
    officeLocation: d.officeLocation,
    orderIndex: d.orderIndex,
    isActive: d.isActive,
    programsCount: d._count.programs,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));
}

export async function getDepartmentById(tenantId: string, id: string): Promise<AcademicDepartmentDto | null> {
  const item = await prisma.academicDepartment.findUnique({
    where: { id },
    include: {
      _count: { select: { programs: true } },
    },
  });
  if (!item || item.tenantId !== tenantId) return null;

  return {
    id: item.id,
    tenantId: item.tenantId,
    code: item.code,
    nameTh: item.nameTh,
    nameEn: item.nameEn,
    descriptionTh: item.descriptionTh,
    descriptionEn: item.descriptionEn,
    headNameTh: item.headNameTh,
    headNameEn: item.headNameEn,
    contactEmail: item.contactEmail,
    contactPhone: item.contactPhone,
    officeLocation: item.officeLocation,
    orderIndex: item.orderIndex,
    isActive: item.isActive,
    programsCount: item._count.programs,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function createDepartment(
  tenantId: string,
  actorId: string,
  input: CreateDepartmentInput
): Promise<AcademicDepartmentDto> {
  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.academicDepartment.create({
      data: {
        tenantId,
        code: input.code,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        descriptionTh: input.descriptionTh || null,
        descriptionEn: input.descriptionEn || null,
        headNameTh: input.headNameTh || null,
        headNameEn: input.headNameEn || null,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        officeLocation: input.officeLocation || null,
        orderIndex: input.orderIndex ?? 0,
        isActive: input.isActive ?? true,
      },
      include: {
        _count: { select: { programs: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "curriculum.department.create",
        entity: "academic_department",
        entityId: item.id,
        after: { code: item.code, nameTh: item.nameTh },
      },
    });

    return item;
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    code: created.code,
    nameTh: created.nameTh,
    nameEn: created.nameEn,
    descriptionTh: created.descriptionTh,
    descriptionEn: created.descriptionEn,
    headNameTh: created.headNameTh,
    headNameEn: created.headNameEn,
    contactEmail: created.contactEmail,
    contactPhone: created.contactPhone,
    officeLocation: created.officeLocation,
    orderIndex: created.orderIndex,
    isActive: created.isActive,
    programsCount: created._count.programs,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateDepartment(
  tenantId: string,
  actorId: string,
  input: UpdateDepartmentInput
): Promise<AcademicDepartmentDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.academicDepartment.update({
      where: { id: input.id, tenantId },
      data: {
        code: input.code,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        descriptionTh: input.descriptionTh,
        descriptionEn: input.descriptionEn,
        headNameTh: input.headNameTh,
        headNameEn: input.headNameEn,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        officeLocation: input.officeLocation,
        orderIndex: input.orderIndex,
        isActive: input.isActive,
      },
      include: {
        _count: { select: { programs: true } },
      },
    });

    // หากมีการเปลี่ยนชื่อภาควิชา ให้อัปเดตชื่อสตริงใน AcademicProgram ที่ผูกอยู่ด้วยเพื่อความสม่ำเสมอ
    if (input.nameTh) {
      await tx.academicProgram.updateMany({
        where: { tenantId, departmentId: item.id },
        data: { department: input.nameTh },
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "curriculum.department.update",
        entity: "academic_department",
        entityId: item.id,
        after: { code: item.code, nameTh: item.nameTh },
      },
    });

    return item;
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    code: updated.code,
    nameTh: updated.nameTh,
    nameEn: updated.nameEn,
    descriptionTh: updated.descriptionTh,
    descriptionEn: updated.descriptionEn,
    headNameTh: updated.headNameTh,
    headNameEn: updated.headNameEn,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    officeLocation: updated.officeLocation,
    orderIndex: updated.orderIndex,
    isActive: updated.isActive,
    programsCount: updated._count.programs,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteDepartment(tenantId: string, actorId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // ป้องกันการลบภาควิชาที่มีหลักสูตรสังกัดอยู่
    const linkedProgramsCount = await tx.academicProgram.count({
      where: { tenantId, departmentId: id },
    });
    if (linkedProgramsCount > 0) {
      throw new Error("ไม่สามารถลบภาควิชาได้เนื่องจากยังมีหลักสูตรสังกัดอยู่ กรุณาย้ายหรือลบหลักสูตรก่อน");
    }

    const existing = await tx.academicDepartment.findUnique({
      where: { id, tenantId },
      select: { code: true, nameTh: true },
    });

    await tx.academicDepartment.delete({
      where: { id, tenantId },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "curriculum.department.delete",
        entity: "academic_department",
        entityId: id,
        before: existing ? { code: existing.code, nameTh: existing.nameTh } : undefined,
      },
    });
  });
}

