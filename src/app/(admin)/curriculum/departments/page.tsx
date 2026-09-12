import { requirePermission, hasPermission } from "@/features/identity/server";
import { CURRICULUM_P, listPrograms, listDepartments } from "@/features/curriculum/server";
import { CurriculumClient } from "../_components/curriculum-client";

export default async function DepartmentsPage() {
  const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
  const [initialItems, initialDepartments] = await Promise.all([
    listPrograms(ctx.tenantId),
    listDepartments(ctx.tenantId),
  ]);

  return (
    <CurriculumClient
      initialItems={initialItems}
      initialDepartments={initialDepartments}
      canManage={hasPermission(ctx, CURRICULUM_P.curriculumManage)}
      defaultTab="departments"
    />
  );
}

