import type { PermissionDef } from "@/shared/lib/permission-def";

export const P = {
  usersRead: "users:read",
  usersManage: "users:manage",
  rolesManage: "roles:manage",
  settingsManage: "settings:manage",
  auditRead: "audit:read",
} as const;

export const IDENTITY_PERMISSIONS: readonly PermissionDef[] = [
  { code: P.usersRead, module: "users", action: "read" },
  { code: P.usersManage, module: "users", action: "manage" },
  { code: P.rolesManage, module: "roles", action: "manage" },
  { code: P.settingsManage, module: "settings", action: "manage" },
  { code: P.auditRead, module: "audit", action: "read" },
];

/** บทบาทตั้งต้น — seed และ bootstrap ใช้ร่วมกัน */
export const SUPER_ADMIN_CODE = "SUPER_ADMIN";
export const DEFAULT_ROLES: ReadonlyArray<{ code: string; nameTh: string; nameEn: string; isSystem: boolean; permissions: readonly string[] }> = [
  { code: SUPER_ADMIN_CODE, nameTh: "ผู้ดูแลสูงสุด", nameEn: "Super admin", isSystem: true, permissions: [] },
  {
    code: "ADMIN",
    nameTh: "ผู้ดูแลระบบ",
    nameEn: "Administrator",
    isSystem: false,
    permissions: [
      P.usersRead, P.usersManage, P.rolesManage, P.settingsManage, P.auditRead,
      "news:read", "news:manage", "news:publish",
      "staff:read", "staff:manage",
      "curriculum:read", "curriculum:manage",
      "document:read", "document:submit", "document:review", "document:approve", "document:publish", "document:manage",
      "booking:view", "booking:create", "booking:approve", "booking:manage",
    ],
  },
  {
    code: "STAFF",
    nameTh: "เจ้าหน้าที่",
    nameEn: "Staff",
    isSystem: false,
    permissions: [
      P.usersRead,
      "news:read",
      "staff:read",
      "curriculum:read",
      "document:read",
      "document:submit",
      "booking:view",
      "booking:create",
    ],
  },
  {
    code: "VIEWER",
    nameTh: "ผู้ดู",
    nameEn: "Viewer",
    isSystem: false,
    permissions: [
      P.usersRead,
      "news:read",
      "staff:read",
      "curriculum:read",
      "document:read",
      "booking:view",
    ],
  },
];
