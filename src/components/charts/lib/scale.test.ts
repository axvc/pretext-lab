import { describe, expect, it } from "vitest";
import { log10, logTicks, makeScale } from "./scale";

describe("log10", () => {
  it("returns -Infinity at x = 0", () => {
    expect(log10(0)).toBe(-Infinity);
  });

  it("returns 0 at x = 1", () => {
    expect(log10(1)).toBe(0);
  });

  it("returns 9 at x = 10^9", () => {
    expect(log10(1e9)).toBeCloseTo(9, 12);
  });

  it("matches integer exponents across the typical chart range", () => {
    expect(log10(10)).toBeCloseTo(1, 12);
    expect(log10(100)).toBeCloseTo(2, 12);
    expect(log10(10_000)).toBeCloseTo(4, 12);
  });
});

describe("makeScale (log)", () => {
  const s = makeScale("log", [1, 100], [0, 100]);

  it("maps domain min to range start", () => {
    expect(s(1)).toBeCloseTo(0, 12);
  });

  it("maps the geometric mean to the range midpoint", () => {
    expect(s(10)).toBeCloseTo(50, 12);
  });

  it("maps domain max to range end", () => {
    expect(s(100)).toBeCloseTo(100, 12);
  });

  it("inverts when range is descending (typical for SVG y axis)", () => {
    const yScale = makeScale("log", [1, 100], [400, 0]);
    expect(yScale(1)).toBeCloseTo(400, 12);
    expect(yScale(10)).toBeCloseTo(200, 12);
    expect(yScale(100)).toBeCloseTo(0, 12);
  });
});

describe("makeScale (linear)", () => {
  const s = makeScale("linear", [0, 100], [0, 200]);

  it("maps domain min to range start", () => {
    expect(s(0)).toBe(0);
  });

  it("maps midpoint to range midpoint", () => {
    expect(s(50)).toBe(100);
  });

  it("maps domain max to range end", () => {
    expect(s(100)).toBe(200);
  });
});

describe("logTicks", () => {
  it("emits powers of ten within the domain", () => {
    expect(logTicks([10, 10_000])).toEqual([10, 100, 1000, 10_000]);
  });

  it("clamps to the integer exponents inside the domain", () => {
    expect(logTicks([3, 3000])).toEqual([10, 100, 1000]);
  });
});
