import type { PermissionDef } from "@/shared/lib/permission-def";

export const BOOKING_P = {
  bookingView: "booking:view",
  bookingCreate: "booking:create",
  bookingApprove: "booking:approve",
  bookingManage: "booking:manage",
} as const;

export const BOOKING_PERMISSIONS: readonly PermissionDef[] = [
  { code: BOOKING_P.bookingView, module: "booking", action: "view" },
  { code: BOOKING_P.bookingCreate, module: "booking", action: "create" },
  { code: BOOKING_P.bookingApprove, module: "booking", action: "approve" },
  { code: BOOKING_P.bookingManage, module: "booking", action: "manage" },
];
