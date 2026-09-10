import { prisma } from "@/shared/lib/infra/prisma";
import type { BookingStatus, BookingResourceType, Prisma } from "@/generated/prisma";
import type {
  CreateBookingReservationInput,
  ApproveReservationInput,
  CreateBookingResourceInput,
  UpdateBookingResourceInput,
} from "./validations";
import { checkBookingConflict } from "./conflict";

export interface BookingResourceDto {
  id: string;
  tenantId: string;
  type: BookingResourceType;
  nameTh: string;
  nameEn: string;
  capacity: number;
  locationOrPlate: string;
  amenities: string[];
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BookingReservationDto {
  id: string;
  tenantId: string;
  resourceId: string;
  resourceNameTh: string;
  resourceType: BookingResourceType;
  userId: string;
  userName: string;
  title: string;
  destination: string | null;
  driverRequired: boolean;
  driverName: string | null;
  startTime: string;
  endTime: string;
  attendeesCount: number;
  status: BookingStatus;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

type BookingReservationWithRelations = Prisma.BookingReservationGetPayload<{
  include: {
    resource: { select: { nameTh: true; type: true } };
    user: { select: { name: true } };
    approver: { select: { name: true } };
  };
}>;

function mapReservationDto(item: BookingReservationWithRelations): BookingReservationDto {
  return {
    id: item.id,
    tenantId: item.tenantId,
    resourceId: item.resourceId,
    resourceNameTh: item.resource.nameTh,
    resourceType: item.resource.type,
    userId: item.userId,
    userName: item.user?.name ?? "",
    title: item.title,
    destination: item.destination,
    driverRequired: item.driverRequired,
    driverName: item.driverName,
    startTime: item.startTime.toISOString(),
    endTime: item.endTime.toISOString(),
    attendeesCount: item.attendeesCount,
    status: item.status,
    approverId: item.approverId,
    approverName: item.approver?.name ?? null,
    approvedAt: item.approvedAt ? item.approvedAt.toISOString() : null,
    rejectionReason: item.rejectionReason,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function listBookingResources(
  tenantId: string,
  options?: { type?: BookingResourceType; includeInactive?: boolean }
): Promise<BookingResourceDto[]> {
  const items = await prisma.bookingResource.findMany({
    where: {
      tenantId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ type: "asc" }, { nameTh: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    type: item.type,
    nameTh: item.nameTh,
    nameEn: item.nameEn,
    capacity: item.capacity,
    locationOrPlate: item.locationOrPlate,
    amenities: Array.isArray(item.amenities) ? (item.amenities as string[]) : [],
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function createBookingResource(
  tenantId: string,
  actorId: string,
  input: CreateBookingResourceInput
): Promise<BookingResourceDto> {
  const created = await prisma.$transaction(async (tx) => {
    const resource = await tx.bookingResource.create({
      data: {
        tenantId,
        type: input.type,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        capacity: input.capacity,
        locationOrPlate: input.locationOrPlate,
        amenities: input.amenities,
        imageUrl: input.imageUrl || null,
        isActive: input.isActive,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "booking_resource.create",
        entity: "booking_resource",
        entityId: resource.id,
        after: { nameTh: resource.nameTh, type: resource.type },
      },
    });

    return resource;
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    type: created.type,
    nameTh: created.nameTh,
    nameEn: created.nameEn,
    capacity: created.capacity,
    locationOrPlate: created.locationOrPlate,
    amenities: Array.isArray(created.amenities) ? (created.amenities as string[]) : [],
    imageUrl: created.imageUrl,
    isActive: created.isActive,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function updateBookingResource(
  tenantId: string,
  actorId: string,
  input: UpdateBookingResourceInput
): Promise<BookingResourceDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const resource = await tx.bookingResource.update({
      where: { id: input.id, tenantId },
      data: {
        type: input.type,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        capacity: input.capacity,
        locationOrPlate: input.locationOrPlate,
        amenities: input.amenities,
        imageUrl: input.imageUrl || null,
        isActive: input.isActive,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "booking_resource.update",
        entity: "booking_resource",
        entityId: resource.id,
      },
    });

    return resource;
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    type: updated.type,
    nameTh: updated.nameTh,
    nameEn: updated.nameEn,
    capacity: updated.capacity,
    locationOrPlate: updated.locationOrPlate,
    amenities: Array.isArray(updated.amenities) ? (updated.amenities as string[]) : [],
    imageUrl: updated.imageUrl,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteBookingResource(tenantId: string, actorId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.bookingResource.delete({
      where: { id, tenantId },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "booking_resource.delete",
        entity: "booking_resource",
        entityId: id,
      },
    });
  });
}

export async function listReservations(
  tenantId: string,
  options?: { resourceId?: string; userId?: string; status?: BookingStatus }
): Promise<BookingReservationDto[]> {
  const items = await prisma.bookingReservation.findMany({
    where: {
      tenantId,
      ...(options?.resourceId ? { resourceId: options.resourceId } : {}),
      ...(options?.userId ? { userId: options.userId } : {}),
      ...(options?.status ? { status: options.status } : {}),
    },
    include: {
      resource: { select: { nameTh: true, type: true } },
      user: { select: { name: true } },
      approver: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return items.map(mapReservationDto);
}

export async function createReservation(
  tenantId: string,
  userId: string,
  input: CreateBookingReservationInput
): Promise<BookingReservationDto> {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  // Time Slot Conflict Check
  const hasConflict = await checkBookingConflict({
    tenantId,
    resourceId: input.resourceId,
    startTime: start,
    endTime: end,
  });

  if (hasConflict) {
    throw new Error("ช่วงเวลาดังกล่าวมีผู้จองแล้วหรืออยู่ระหว่างรออนุมัติ กรุณาเลือกช่วงเวลาหรือห้องอื่น");
  }

  const created = await prisma.$transaction(async (tx) => {
    const res = await tx.bookingReservation.create({
      data: {
        tenantId,
        userId,
        resourceId: input.resourceId,
        title: input.title,
        destination: input.destination || null,
        startTime: start,
        endTime: end,
        attendeesCount: input.attendeesCount,
        driverRequired: input.driverRequired,
        status: "PENDING",
      },
      include: {
        resource: { select: { nameTh: true, type: true } },
        user: { select: { name: true } },
        approver: { select: { name: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: userId,
        action: "booking_reservation.create",
        entity: "booking_reservation",
        entityId: res.id,
        after: { title: res.title, resourceId: res.resourceId, start, end },
      },
    });

    return res;
  });

  return mapReservationDto(created);
}

export async function processReservationApproval(
  tenantId: string,
  approverId: string,
  input: ApproveReservationInput
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.bookingReservation.findUnique({
      where: { id: input.reservationId, tenantId },
    });
    if (!reservation) throw new Error("Reservation not found");

    if (input.action === "APPROVED") {
      // ตรวจสอบความขัดแย้งอีกครั้งก่อนอนุมัติ
      const hasConflict = await checkBookingConflict({
        tenantId,
        resourceId: reservation.resourceId,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        excludeReservationId: reservation.id,
      });

      if (hasConflict) {
        throw new Error("ไม่สามารถอนุมัติได้เนื่องจากมีรายการอนุมัติอื่นทับซ้อนกับช่วงเวลานี้แล้ว");
      }
    }

    await tx.bookingReservation.update({
      where: { id: input.reservationId },
      data: {
        status: input.action,
        driverName: input.driverName || null,
        approverId,
        approvedAt: input.action === "APPROVED" ? new Date() : null,
        rejectionReason: input.action === "REJECTED" ? input.rejectionReason || null : null,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: approverId,
        action: `booking_reservation.${input.action.toLowerCase()}`,
        entity: "booking_reservation",
        entityId: input.reservationId,
        after: { action: input.action, driverName: input.driverName },
      },
    });
  });
}

export async function cancelReservation(tenantId: string, id: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.bookingReservation.findUnique({
      where: { id, tenantId },
    });
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.userId !== userId) throw new Error("Unauthorized to cancel this reservation");

    await tx.bookingReservation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: userId,
        action: "booking_reservation.cancel",
        entity: "booking_reservation",
        entityId: id,
      },
    });
  });
}

