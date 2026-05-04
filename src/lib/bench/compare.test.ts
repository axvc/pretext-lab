import { describe, expect, it } from "vitest";
import { compare } from "./compare";
import type { BenchSummary } from "./types";

function summary(p50: number, extras: Partial<BenchSummary> = {}): BenchSummary {
  return {
    p50,
    p95: extras.p95 ?? p50 * 1.5,
    p99: extras.p99 ?? p50 * 2,
    mean: extras.mean ?? p50,
    stdDev: extras.stdDev ?? 0,
    min: extras.min ?? p50,
    max: extras.max ?? p50,
    n: extras.n ?? 1000,
  };
}

describe("compare", () => {
  it("picks the slowest p50 as baseline and computes ratios", () => {
    const result = compare({
      dom: summary(100),
      canvas: summary(20),
      pretext: summary(0.5),
    });

    expect(result.baseline).toBe("dom");
    expect(result.metric).toBe("p50");
    expect(result.ratios.dom).toBeCloseTo(1, 10);
    expect(result.ratios.canvas).toBeCloseTo(5, 10);
    expect(result.ratios.pretext).toBeCloseTo(200, 10);
  });

  it("works with a single entry", () => {
    const result = compare({ only: summary(42) });
    expect(result.baseline).toBe("only");
    expect(result.ratios.only).toBe(1);
  });

  it("honors an alternative metric", () => {
    const result = compare(
      {
        a: summary(10, { p95: 1000 }),
        b: summary(50, { p95: 100 }),
      },
      { metric: "p95" },
    );
    expect(result.metric).toBe("p95");
    expect(result.baseline).toBe("a");
    expect(result.ratios.a).toBeCloseTo(1, 10);
    expect(result.ratios.b).toBeCloseTo(10, 10);
  });

  it("handles ties by keeping the first encountered baseline", () => {
    const result = compare({
      first: summary(50),
      second: summary(50),
    });
    expect(result.baseline).toBe("first");
    expect(result.ratios.first).toBe(1);
    expect(result.ratios.second).toBe(1);
  });

  it("throws on empty input", () => {
    expect(() => compare({} as Record<string, BenchSummary>)).toThrow(/empty/);
  });
});
