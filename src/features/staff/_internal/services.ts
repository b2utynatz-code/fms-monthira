import { prisma } from "@/shared/lib/infra/prisma";
import type { AcademicPosition } from "@/generated/prisma";
import type { CreateStaffInput, UpdateStaffInput } from "./validations";

export interface FacultyMemberDto {
  id: string;
  tenantId: string;
  userId: string | null;
  titleTh: string;
  titleEn: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  fullNameTh: string;
  fullNameEn: string;
  academicPosition: AcademicPosition;
  adminPositionTh: string | null;
  adminPositionEn: string | null;
  department: string;
  email: string;
  phoneExt: string | null;
  roomNumber: string | null;
  avatarUrl: string | null;
  expertise: string[];
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listFacultyMembers(tenantId: string, options?: { department?: string; isActive?: boolean }): Promise<FacultyMemberDto[]> {
  const items = await prisma.facultyMember.findMany({
    where: {
      tenantId,
      ...(options?.department ? { department: options.department } : {}),
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
  });

  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    userId: item.userId,
    titleTh: item.titleTh,
    titleEn: item.titleEn,
    firstNameTh: item.firstNameTh,
    lastNameTh: item.lastNameTh,
    firstNameEn: item.firstNameEn,
    lastNameEn: item.lastNameEn,
    fullNameTh: `${item.titleTh} ${item.firstNameTh} ${item.lastNameTh}`,
    fullNameEn: `${item.titleEn} ${item.firstNameEn} ${item.lastNameEn}`,
    academicPosition: item.academicPosition,
    adminPositionTh: item.adminPositionTh,
    adminPositionEn: item.adminPositionEn,
    department: item.department,
    email: item.email,
    phoneExt: item.phoneExt,
    roomNumber: item.roomNumber,
    avatarUrl: item.avatarUrl,
    expertise: Array.isArray(item.expertise) ? (item.expertise as string[]) : [],
    orderIndex: item.orderIndex,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function createFacultyMember(tenantId: string, input: CreateStaffInput): Promise<FacultyMemberDto> {
  const created = await prisma.facultyMember.create({
    data: {
      tenantId,
      titleTh: input.titleTh,
      titleEn: input.titleEn,
      firstNameTh: input.firstNameTh,
      lastNameTh: input.lastNameTh,
      firstNameEn: input.firstNameEn,
      lastNameEn: input.lastNameEn,
      academicPosition: input.academicPosition,
      adminPositionTh: input.adminPositionTh || null,
      adminPositionEn: input.adminPositionEn || null,
      department: input.department,
      email: input.email,
      phoneExt: input.phoneExt || null,
      roomNumber: input.roomNumber || null,
      avatarUrl: input.avatarUrl || null,
      expertise: input.expertise,
      orderIndex: input.orderIndex,
      isActive: input.isActive,
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    userId: created.userId,
    titleTh: created.titleTh,
    titleEn: created.titleEn,
    firstNameTh: created.firstNameTh,
    lastNameTh: created.lastNameTh,
    firstNameEn: created.firstNameEn,
    lastNameEn: created.lastNameEn,
    fullNameTh: `${created.titleTh} ${created.firstNameTh} ${created.lastNameTh}`,
    fullNameEn: `${created.titleEn} ${created.firstNameEn} ${created.lastNameEn}`,
    academicPosition: created.academicPosition,
    adminPositionTh: created.adminPositionTh,
    adminPositionEn: created.adminPositionEn,
    department: created.department,
    email: created.email,
    phoneExt: created.phoneExt,
    roomNumber: created.roomNumber,
    avatarUrl: created.avatarUrl,
    expertise: Array.isArray(created.expertise) ? (created.expertise as string[]) : [],
    orderIndex: created.orderIndex,
    isActive: created.isActive,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateFacultyMember(tenantId: string, input: UpdateStaffInput): Promise<FacultyMemberDto> {
  const updated = await prisma.facultyMember.update({
    where: { id: input.id, tenantId },
    data: {
      titleTh: input.titleTh,
      titleEn: input.titleEn,
      firstNameTh: input.firstNameTh,
      lastNameTh: input.lastNameTh,
      firstNameEn: input.firstNameEn,
      lastNameEn: input.lastNameEn,
      academicPosition: input.academicPosition,
      adminPositionTh: input.adminPositionTh,
      adminPositionEn: input.adminPositionEn,
      department: input.department,
      email: input.email,
      phoneExt: input.phoneExt,
      roomNumber: input.roomNumber,
      avatarUrl: input.avatarUrl || null,
      expertise: input.expertise,
      orderIndex: input.orderIndex,
      isActive: input.isActive,
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    userId: updated.userId,
    titleTh: updated.titleTh,
    titleEn: updated.titleEn,
    firstNameTh: updated.firstNameTh,
    lastNameTh: updated.lastNameTh,
    firstNameEn: updated.firstNameEn,
    lastNameEn: updated.lastNameEn,
    fullNameTh: `${updated.titleTh} ${updated.firstNameTh} ${updated.lastNameTh}`,
    fullNameEn: `${updated.titleEn} ${updated.firstNameEn} ${updated.lastNameEn}`,
    academicPosition: updated.academicPosition,
    adminPositionTh: updated.adminPositionTh,
    adminPositionEn: updated.adminPositionEn,
    department: updated.department,
    email: updated.email,
    phoneExt: updated.phoneExt,
    roomNumber: updated.roomNumber,
    avatarUrl: updated.avatarUrl,
    expertise: Array.isArray(updated.expertise) ? (updated.expertise as string[]) : [],
    orderIndex: updated.orderIndex,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteFacultyMember(tenantId: string, id: string): Promise<void> {
  await prisma.facultyMember.delete({
    where: { id, tenantId },
  });
}
