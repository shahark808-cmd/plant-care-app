import { describe, expect, it } from "vitest";
import { formatAgorot, parseToAgorot, splitAgorot } from "@/lib/money";

describe("parseToAgorot", () => {
  it("parses whole and decimal amounts without float errors", () => {
    expect(parseToAgorot("12")).toBe(1200);
    expect(parseToAgorot("12.5")).toBe(1250);
    expect(parseToAgorot("0.07")).toBe(7);
    expect(parseToAgorot("19.99")).toBe(1999);
    expect(parseToAgorot("₪1,234.56")).toBe(123456);
    expect(parseToAgorot(".5")).toBe(50);
  });

  it("rejects invalid input", () => {
    expect(parseToAgorot("")).toBeNull();
    expect(parseToAgorot("abc")).toBeNull();
    expect(parseToAgorot("1.234")).toBeNull();
    expect(parseToAgorot("-5")).toBeNull();
  });
});

describe("formatAgorot", () => {
  it("formats shekels", () => {
    expect(formatAgorot(1200)).toContain("12");
    expect(formatAgorot(1250)).toContain("12.50");
    expect(formatAgorot(-1250)).toMatch(/^-/);
  });
});

describe("splitAgorot", () => {
  it("never loses an agora", () => {
    const [a, b] = splitAgorot(1001, 50);
    expect(a + b).toBe(1001);
    const [c, d] = splitAgorot(999, 33);
    expect(c + d).toBe(999);
  });
});
