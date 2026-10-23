import { describe, expect, it } from "vitest";
import {
  addMonths, dailyAllowance, effectiveBudgets, effectiveDate, installmentPlan, nextChargeDate,
  nextOccurrence, split503020, upcomingCharge,
} from "@/lib/budget";

describe("addMonths", () => {
  it("clamps to month length and crosses years", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
  });
});

describe("nextChargeDate", () => {
  it("is the next 2nd after the purchase", () => {
    expect(nextChargeDate("2026-03-10")).toBe("2026-04-02");
    expect(nextChargeDate("2026-03-01")).toBe("2026-03-02");
  });
  it("purchase on the charge day moves to next month", () => {
    expect(nextChargeDate("2026-03-02")).toBe("2026-04-02");
  });
  it("handles year end and short months", () => {
    expect(nextChargeDate("2026-12-20")).toBe("2027-01-02");
    expect(nextChargeDate("2026-01-31", 31)).toBe("2026-02-28");
  });
});

describe("installmentPlan", () => {
  it("never loses an agora and spreads across months", () => {
    const plan = installmentPlan(10001, 3, "2026-01-31", 2);
    expect(plan.map((p) => p.amount)).toEqual([3335, 3333, 3333]);
    expect(plan.reduce((s, p) => s + p.amount, 0)).toBe(10001);
    expect(plan.map((p) => p.date)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    expect(plan.map((p) => p.chargeDate)).toEqual(["2026-02-02", "2026-03-02", "2026-04-02"]);
  });
  it("12 installments cover 12 consecutive months", () => {
    const plan = installmentPlan(120000, 12, "2026-05-10", null);
    expect(plan).toHaveLength(12);
    expect(plan[11]!.date).toBe("2027-04-10");
    expect(plan.every((p) => p.chargeDate === null)).toBe(true);
  });
});

describe("split503020", () => {
  it("splits 50/30/20 across bucket categories without losing agorot", () => {
    const r = split503020(1000001, [
      { id: "a", bucket: "needs" }, { id: "b", bucket: "needs" },
      { id: "c", bucket: "wants" }, { id: "d", bucket: "savings" }, { id: "x", bucket: null },
    ]);
    expect(r.x).toBeUndefined();
    expect(r.a! + r.b!).toBe(500001);
    expect(r.c).toBe(300000);
    expect(r.d).toBe(200000);
  });
});

describe("effectiveBudgets", () => {
  it("carries the latest budget at or before the period forward", () => {
    const rows = [
      { category_id: "a", period_start: "2026-01-10", amount: 100 },
      { category_id: "a", period_start: "2026-03-10", amount: 300 },
      { category_id: "b", period_start: "2026-05-10", amount: 999 },
    ];
    expect(effectiveBudgets(rows, "2026-04-10").get("a")).toBe(300);
    expect(effectiveBudgets(rows, "2026-02-10").get("a")).toBe(100);
    expect(effectiveBudgets(rows, "2026-04-10").has("b")).toBe(false);
  });
});

describe("dailyAllowance", () => {
  it("divides what is left by days left", () => {
    expect(dailyAllowance(300000, 90000, 10)).toEqual({ remaining: 210000, perDay: 21000 });
  });
  it("never shows a negative daily amount", () => {
    expect(dailyAllowance(100, 5000, 5)).toEqual({ remaining: -4900, perDay: 0 });
  });
});

describe("view modes", () => {
  it("purchase view uses date, charge view uses charge_date with fallback", () => {
    expect(effectiveDate({ date: "2026-03-10", charge_date: "2026-04-02" }, "purchase")).toBe("2026-03-10");
    expect(effectiveDate({ date: "2026-03-10", charge_date: "2026-04-02" }, "charge")).toBe("2026-04-02");
    expect(effectiveDate({ date: "2026-03-10", charge_date: null }, "charge")).toBe("2026-03-10");
  });
  it("upcomingCharge sums the nearest future charge date", () => {
    const txs = [
      { amount: 100, type: "expense" as const, charge_date: "2026-04-02" },
      { amount: 250, type: "expense" as const, charge_date: "2026-04-02" },
      { amount: 999, type: "expense" as const, charge_date: "2026-05-02" },
      { amount: 5, type: "expense" as const, charge_date: "2026-03-02" },
      { amount: 7, type: "income" as const, charge_date: "2026-04-02" },
    ];
    expect(upcomingCharge(txs, "2026-03-20")).toEqual({ date: "2026-04-02", amount: 350 });
    expect(upcomingCharge([], "2026-03-20")).toBeNull();
  });
});

describe("nextOccurrence", () => {
  it("returns this month if still ahead, else next month", () => {
    expect(nextOccurrence(15, "2026-03-10")).toBe("2026-03-15");
    expect(nextOccurrence(15, "2026-03-15")).toBe("2026-03-15");
    expect(nextOccurrence(5, "2026-03-10")).toBe("2026-04-05");
    expect(nextOccurrence(5, "2026-12-10")).toBe("2027-01-05");
  });
});
