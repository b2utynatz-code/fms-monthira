import { z } from "zod";

export const academicPositionEnum = z.enum(["PROFESSOR", "ASSOC_PROF", "ASST_PROF", "LECTURER", "OFFICER"]);

export const createStaffSchema = z.object({
  titleTh: z.string().min(1, "กรุณากรอกคำนำหน้าชื่อ (ไทย)").max(100),
  titleEn: z.string().min(1, "Please enter English title").max(100),
  firstNameTh: z.string().min(1, "กรุณากรอกชื่อ (ไทย)").max(100),
  lastNameTh: z.string().min(1, "กรุณากรอกนามสกุล (ไทย)").max(100),
  firstNameEn: z.string().min(1, "Please enter English first name").max(100),
  lastNameEn: z.string().min(1, "Please enter English last name").max(100),
  academicPosition: academicPositionEnum.default("LECTURER"),
  adminPositionTh: z.string().max(150).optional(),
  adminPositionEn: z.string().max(150).optional(),
  department: z.string().min(1, "กรุณากรอกภาควิชาหรือสังกัด").max(150),
  email: z.string().email("อีเมลไม่ถูกต้อง").max(255),
  phoneExt: z.string().max(50).optional(),
  roomNumber: z.string().max(50).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
  expertise: z.array(z.string()).default([]),
  orderIndex: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateStaffSchema = createStaffSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
