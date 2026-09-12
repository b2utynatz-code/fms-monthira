import "server-only";

export {
  listPrograms,
  getProgramById,
  listDepartments,
  getDepartmentById,
  type AcademicProgramDto,
  type AcademicDepartmentDto,
} from "./_internal/services";
export { CURRICULUM_P, CURRICULUM_PERMISSIONS } from "./permissions";

