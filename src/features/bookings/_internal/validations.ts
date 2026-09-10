import { z } from "zod";

export const bookingResourceTypeEnum = z.enum(["MEETING_ROOM", "VEHICLE"]);
export const bookingStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const baseBookingReservationSchema = z.object({
  resourceId: z.string().uuid("กรุณาเลือกห้องหรือยานพาหนะ"),
  title: z.string().min(1, "กรุณาระบุวัตถุประสงค์การจอง").max(255),
  destination: z.string().max(255).optional(),
  startTime: z.string().datetime("กรุณาระบุเวลาเริ่มต้นที่ถูกต้อง"),
  endTime: z.string().datetime("กรุณาระบุเวลาสิ้นสุดที่ถูกต้อง"),
  attendeesCount: z.number().int().min(1).default(1),
  driverRequired: z.boolean().default(false),
});

export const createBookingReservationSchema = baseBookingReservationSchema.refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
    path: ["endTime"],
  }
);

export const updateBookingReservationSchema = baseBookingReservationSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
      path: ["endTime"],
    }
  );


export const approveReservationSchema = z.object({
  reservationId: z.string().uuid(),
  action: z.enum(["APPROVED", "REJECTED"]),
  driverName: z.string().max(150).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export const createBookingResourceSchema = z.object({
  type: bookingResourceTypeEnum,
  nameTh: z.string().min(1, "กรุณากรอกชื่อทรัพยากร (ไทย)").max(150),
  nameEn: z.string().min(1, "Please enter English name").max(150),
  capacity: z.number().int().min(1, "ความจุต้องอย่างน้อย 1"),
  locationOrPlate: z.string().min(1, "กรุณาระบุสถานที่ตั้งหรือทะเบียนรถ").max(150),
  amenities: z.array(z.string()).default([]),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateBookingResourceSchema = createBookingResourceSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateBookingReservationInput = z.infer<typeof createBookingReservationSchema>;
export type UpdateBookingReservationInput = z.infer<typeof updateBookingReservationSchema>;
export type ApproveReservationInput = z.infer<typeof approveReservationSchema>;
export type CreateBookingResourceInput = z.infer<typeof createBookingResourceSchema>;
export type UpdateBookingResourceInput = z.infer<typeof updateBookingResourceSchema>;

