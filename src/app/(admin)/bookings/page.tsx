import { requirePermission, hasPermission } from "@/features/identity/server";
import { BOOKING_P, listReservations, listBookingResources } from "@/features/bookings/server";
import { BookingsClient } from "./_components/bookings-client";

export default async function BookingsPage() {
  const ctx = await requirePermission(BOOKING_P.bookingView);
  const [initialReservations, resources] = await Promise.all([
    listReservations(ctx.tenantId),
    listBookingResources(ctx.tenantId, { includeInactive: true }),
  ]);

  return (
    <BookingsClient
      initialReservations={initialReservations}
      resources={resources}
      canCreate={hasPermission(ctx, BOOKING_P.bookingCreate)}
      canApprove={hasPermission(ctx, BOOKING_P.bookingApprove)}
      canManage={hasPermission(ctx, BOOKING_P.bookingManage)}
    />
  );
}

