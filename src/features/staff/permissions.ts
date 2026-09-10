import type { PermissionDef } from "@/shared/lib/permission-def";

export const STAFF_P = {
  staffRead: "staff:read",
  staffManage: "staff:manage",
  staffExport: "staff:export",
} as const;

export const STAFF_PERMISSIONS: readonly PermissionDef[] = [
  { code: STAFF_P.staffRead, module: "staff", action: "read" },
  { code: STAFF_P.staffManage, module: "staff", action: "manage" },
  { code: STAFF_P.staffExport, module: "staff", action: "export" },
];
