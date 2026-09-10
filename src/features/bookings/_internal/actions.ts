"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { BOOKING_P } from "../permissions";
import {
  createBookingReservationSchema,
  approveReservationSchema,
  createBookingResourceSchema,
  updateBookingResourceSchema,
} from "./validations";
import {
  createReservation,
  processReservationApproval,
  cancelReservation,
  listReservations,
  listBookingResources,
  createBookingResource,
  updateBookingResource,
  deleteBookingResource,
  type BookingReservationDto,
  type BookingResourceDto,
} from "./services";

export async function getBookingResourcesAction(type?: "MEETING_ROOM" | "VEHICLE"): Promise<ActionResult<BookingResourceDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingView);
    return listBookingResources(ctx.tenantId, { type });
  });
}

export async function getReservationListAction(options?: { resourceId?: string; userId?: string; status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" }): Promise<ActionResult<BookingReservationDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingView);
    return listReservations(ctx.tenantId, options);
  });
}

export async function createReservationAction(input: unknown): Promise<ActionResult<BookingReservationDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingCreate);
    const parsed = createBookingReservationSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createReservation(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/bookings");
    return result;
  });
}

export async function approveReservationAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingApprove);
    const parsed = approveReservationSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await processReservationApproval(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/bookings");
  });
}

export async function cancelReservationAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingCreate);
    await cancelReservation(ctx.tenantId, id, ctx.userId);
    revalidatePath("/bookings");
  });
}

export async function createBookingResourceAction(input: unknown): Promise<ActionResult<BookingResourceDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const parsed = createBookingResourceSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createBookingResource(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/bookings");
    return result;
  });
}

export async function updateBookingResourceAction(input: unknown): Promise<ActionResult<BookingResourceDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const parsed = updateBookingResourceSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateBookingResource(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/bookings");
    return result;
  });
}

export async function deleteBookingResourceAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    await deleteBookingResource(ctx.tenantId, ctx.userId, id);
    revalidatePath("/bookings");
  });
}
