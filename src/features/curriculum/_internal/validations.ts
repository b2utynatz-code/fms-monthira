import { z } from "zod";

export const degreeLevelEnum = z.enum(["BACHELOR", "MASTER", "DOCTORAL", "DIPLOMA"]);
export const programStatusEnum = z.enum(["OPEN_ADMISSION", "ACTIVE", "PHASING_OUT", "CLOSED"]);

export const createProgramSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสหลักสูตร").max(50),
  nameTh: z.string().min(1, "กรุณากรอกชื่อหลักสูตร (ไทย)").max(255),
  nameEn: z.string().min(1, "Please enter English program name").max(255),
  degreeTh: z.string().min(1, "กรุณากรอกชื่อปริญญา (ไทย)").max(150),
  degreeEn: z.string().min(1, "Please enter English degree name").max(150),
  degreeLevel: degreeLevelEnum.default("BACHELOR"),
  departmentId: z.string().uuid().optional().nullable(),
  department: z.string().max(150).optional().default(""),
  durationYears: z.number().int().min(1).max(10).default(4),
  totalCredits: z.number().int().min(1),
  tuitionFeePerTerm: z.number().optional().nullable(),
  careerPaths: z.array(z.string()).default([]),
  admissionLink: z.string().url().max(500).optional().or(z.literal("")),
  curriculumPdfUrl: z.string().url().max(500).optional().or(z.literal("")),
  descriptionTh: z.string().optional(),
  descriptionEn: z.string().optional(),
  status: programStatusEnum.default("ACTIVE"),
});

export const updateProgramSchema = createProgramSchema.partial().extend({
  id: z.string().uuid(),
});

export const createDepartmentSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสภาควิชา").max(50),
  nameTh: z.string().min(1, "กรุณากรอกชื่อภาควิชา (ไทย)").max(255),
  nameEn: z.string().min(1, "Please enter English department name").max(255),
  descriptionTh: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  headNameTh: z.string().max(150).optional().nullable(),
  headNameEn: z.string().max(150).optional().nullable(),
  contactEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").max(255).optional().or(z.literal("")).nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  officeLocation: z.string().max(150).optional().nullable(),
  orderIndex: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
