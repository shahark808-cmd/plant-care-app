import { describe, expect, it } from "vitest";
import { daysLeftInPeriod, periodFor } from "@/lib/period";

describe("periodFor (start day 10)", () => {
  it("date on/after the 10th belongs to the period starting that month", () => {
    expect(periodFor("2026-03-10")).toEqual({ start: "2026-03-10", end: "2026-04-09" });
    expect(periodFor("2026-03-25")).toEqual({ start: "2026-03-10", end: "2026-04-09" });
  });

  it("date before the 10th belongs to the previous period", () => {
    expect(periodFor("2026-03-09")).toEqual({ start: "2026-02-10", end: "2026-03-09" });
  });

  it("handles year boundaries", () => {
    expect(periodFor("2026-01-05")).toEqual({ start: "2025-12-10", end: "2026-01-09" });
    expect(periodFor("2026-12-20")).toEqual({ start: "2026-12-10", end: "2027-01-09" });
  });

  it("clamps a late start day in short months", () => {
    expect(periodFor("2026-02-28", 31)).toEqual({ start: "2026-02-28", end: "2026-03-30" });
  });
});

describe("daysLeftInPeriod", () => {
  it("counts today", () => {
    expect(daysLeftInPeriod("2026-04-09")).toBe(1);
    expect(daysLeftInPeriod("2026-03-10")).toBe(31);
  });
});
