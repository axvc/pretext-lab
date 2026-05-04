import { describe, expect, it } from "vitest";
import { summarize } from "./summarize";

describe("summarize", () => {
  it("computes percentiles via linear interpolation on 1..100", () => {
    const input = Array.from({ length: 100 }, (_, i) => i + 1);
    const s = summarize(input);

    expect(s.n).toBe(100);
    expect(s.min).toBe(1);
    expect(s.max).toBe(100);
    expect(s.p50).toBeCloseTo(50.5, 5);
    expect(s.p95).toBeCloseTo(95.05, 5);
    expect(s.p99).toBeCloseTo(99.01, 5);
    expect(s.mean).toBeCloseTo(50.5, 5);
  });

  it("returns the constant for constant input and zero stdDev", () => {
    const s = summarize([5, 5, 5, 5, 5]);
    expect(s.p50).toBe(5);
    expect(s.p95).toBe(5);
    expect(s.p99).toBe(5);
    expect(s.mean).toBe(5);
    expect(s.stdDev).toBe(0);
    expect(s.min).toBe(5);
    expect(s.max).toBe(5);
    expect(s.n).toBe(5);
  });

  it("handles single-element input", () => {
    const s = summarize([42]);
    expect(s.p50).toBe(42);
    expect(s.p95).toBe(42);
    expect(s.p99).toBe(42);
    expect(s.mean).toBe(42);
    expect(s.stdDev).toBe(0);
    expect(s.min).toBe(42);
    expect(s.max).toBe(42);
    expect(s.n).toBe(1);
  });

  it("is order-independent (sorts internally)", () => {
    const ascending = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = [7, 2, 10, 5, 1, 9, 3, 8, 4, 6];
    expect(summarize(shuffled)).toEqual(summarize(ascending));
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    const before = [...input];
    summarize(input);
    expect(input).toEqual(before);
  });

  it("computes a known stdDev case", () => {
    // values [2, 4, 4, 4, 5, 5, 7, 9] — population stdDev = 2
    const s = summarize([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s.mean).toBe(5);
    expect(s.stdDev).toBeCloseTo(2, 10);
  });

  it("throws on empty input", () => {
    expect(() => summarize([])).toThrow(/empty/);
  });
});
