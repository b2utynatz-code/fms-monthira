import { describe, it, expect } from "vitest";
import { isTimeOverlapping } from "./conflict";

describe("booking conflict detection", () => {
  const baseSlot = {
    startTime: new Date("2026-09-15T09:00:00.000Z"),
    endTime: new Date("2026-09-15T12:00:00.000Z"),
  };

  it("should detect conflict when target is completely inside base slot", () => {
    const target = {
      startTime: new Date("2026-09-15T10:00:00.000Z"),
      endTime: new Date("2026-09-15T11:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(true);
  });

  it("should detect conflict when target completely encloses base slot", () => {
    const target = {
      startTime: new Date("2026-09-15T08:00:00.000Z"),
      endTime: new Date("2026-09-15T13:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(true);
  });

  it("should detect conflict when target overlaps start of base slot", () => {
    const target = {
      startTime: new Date("2026-09-15T08:30:00.000Z"),
      endTime: new Date("2026-09-15T10:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(true);
  });

  it("should detect conflict when target overlaps end of base slot", () => {
    const target = {
      startTime: new Date("2026-09-15T11:00:00.000Z"),
      endTime: new Date("2026-09-15T13:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(true);
  });

  it("should NOT detect conflict when target ends exactly when base slot starts (adjacent)", () => {
    const target = {
      startTime: new Date("2026-09-15T07:00:00.000Z"),
      endTime: new Date("2026-09-15T09:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(false);
  });

  it("should NOT detect conflict when target starts exactly when base slot ends (adjacent)", () => {
    const target = {
      startTime: new Date("2026-09-15T12:00:00.000Z"),
      endTime: new Date("2026-09-15T14:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(false);
  });

  it("should NOT detect conflict when slots are on different days", () => {
    const target = {
      startTime: new Date("2026-09-16T09:00:00.000Z"),
      endTime: new Date("2026-09-16T12:00:00.000Z"),
    };
    expect(isTimeOverlapping(baseSlot, target)).toBe(false);
  });
});
