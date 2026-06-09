import { describe, it, expect } from "vitest";
import { formatNumber, formatCurrency, cn } from "./utils";

describe("utils", () => {
  describe("formatNumber", () => {
    it("formats numbers with locale separators", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("formats compact numbers", () => {
      expect(formatNumber(1500000, true)).toBe("1.5M");
      expect(formatNumber(1500, true)).toBe("1.5K");
      expect(formatNumber(500, true)).toBe("500");
    });
  });

  describe("formatCurrency", () => {
    it("formats USD currency", () => {
      expect(formatCurrency(1234)).toBe("$1,234");
    });

    it("formats compact currency", () => {
      expect(formatCurrency(1500, "USD", true)).toBe("$1.5K");
    });
  });

  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });
  });
});
