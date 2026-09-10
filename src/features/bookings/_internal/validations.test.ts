import { describe, it, expect } from "vitest";
import {
  createBookingReservationSchema,
  createBookingResourceSchema,
  approveReservationSchema,
} from "./validations";

describe("bookings validations", () => {
  const dummyUuid = "123e4567-e89b-12d3-a456-426614174000";

  describe("createBookingReservationSchema", () => {
    it("validates successfully for correct booking input", () => {
      const valid = {
        resourceId: dummyUuid,
        title: "ประชุมคณะกรรมการประจำคณะ",
        startTime: "2026-09-15T09:00:00.000Z",
        endTime: "2026-09-15T12:00:00.000Z",
        attendeesCount: 12,
        driverRequired: false,
      };
      const parsed = createBookingReservationSchema.parse(valid);
      expect(parsed.title).toBe("ประชุมคณะกรรมการประจำคณะ");
      expect(parsed.attendeesCount).toBe(12);
    });

    it("throws error when endTime is before or equal to startTime", () => {
      const invalid = {
        resourceId: dummyUuid,
        title: "ประชุมคณะกรรมการประจำคณะ",
        startTime: "2026-09-15T12:00:00.000Z",
        endTime: "2026-09-15T09:00:00.000Z",
        attendeesCount: 12,
      };
      expect(() => createBookingReservationSchema.parse(invalid)).toThrow("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
    });
  });

  describe("createBookingResourceSchema", () => {
    it("validates meeting room resource successfully", () => {
      const valid = {
        type: "MEETING_ROOM" as const,
        nameTh: "ห้องประชุม 1",
        nameEn: "Meeting Room 1",
        capacity: 30,
        locationOrPlate: "อาคาร 1 ชั้น 3",
        amenities: ["Projector", "Mic"],
        isActive: true,
      };
      const parsed = createBookingResourceSchema.parse(valid);
      expect(parsed.nameTh).toBe("ห้องประชุม 1");
      expect(parsed.capacity).toBe(30);
    });

    it("throws error when capacity is zero or negative", () => {
      const invalid = {
        type: "VEHICLE" as const,
        nameTh: "รถตู้คณะ",
        nameEn: "Faculty Van",
        capacity: 0,
        locationOrPlate: "ฮฮ-1234",
        amenities: [],
        isActive: true,
      };
      expect(() => createBookingResourceSchema.parse(invalid)).toThrow();
    });
  });

  describe("approveReservationSchema", () => {
    it("validates approval with driver assignment", () => {
      const valid = {
        reservationId: dummyUuid,
        action: "APPROVED" as const,
        driverName: "นายสมชาย ใจดี",
      };
      const parsed = approveReservationSchema.parse(valid);
      expect(parsed.action).toBe("APPROVED");
      expect(parsed.driverName).toBe("นายสมชาย ใจดี");
    });

    it("validates rejection with reason", () => {
      const valid = {
        reservationId: dummyUuid,
        action: "REJECTED" as const,
        rejectionReason: "ห้องปิดปรับปรุงระบบไฟฟ้า",
      };
      const parsed = approveReservationSchema.parse(valid);
      expect(parsed.action).toBe("REJECTED");
      expect(parsed.rejectionReason).toBe("ห้องปิดปรับปรุงระบบไฟฟ้า");
    });
  });
});
