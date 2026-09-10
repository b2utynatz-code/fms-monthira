import { requirePermission, hasPermission } from "@/features/identity/server";
import { STAFF_P, listFacultyMembers } from "@/features/staff/server";
import { StaffClient } from "./_components/staff-client";

export default async function StaffPage() {
  const ctx = await requirePermission(STAFF_P.staffRead);
  const initialItems = await listFacultyMembers(ctx.tenantId);
  return (
    <StaffClient
      initialItems={initialItems}
      canManage={hasPermission(ctx, STAFF_P.staffManage)}
    />
  );
}
