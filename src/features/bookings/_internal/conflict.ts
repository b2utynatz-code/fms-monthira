import { prisma } from "@/shared/lib/infra/prisma";

/**
 * ตรวจสอบว่ามีรายการจองที่ได้รับการอนุมัติ (APPROVED) หรือรอการอนุมัติ (PENDING)
 * ในห้อง/ยานพาหนะเดียวกันที่เวลาซ้อนทับกันหรือไม่
 * 
 * ช่วงเวลาทับซ้อนกันเมื่อ: start_time < new_end_time AND end_time > new_start_time
 */
export function isTimeOverlapping(
  existing: { startTime: Date; endTime: Date },
  target: { startTime: Date; endTime: Date }
): boolean {
  return existing.startTime.getTime() < target.endTime.getTime() &&
    existing.endTime.getTime() > target.startTime.getTime();
}

export async function checkBookingConflict(params: {
  tenantId: string;
  resourceId: string;
  startTime: Date;
  endTime: Date;
  excludeReservationId?: string;
}): Promise<boolean> {
  const { tenantId, resourceId, startTime, endTime, excludeReservationId } = params;

  const overlapping = await prisma.bookingReservation.findFirst({
    where: {
      tenantId,
      resourceId,
      status: { in: ["APPROVED", "PENDING"] },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
  });

  return !!overlapping;
}
