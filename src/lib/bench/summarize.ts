import type { BenchSummary } from "./types";

export function summarize(timings: readonly number[]): BenchSummary {
  if (timings.length === 0) {
    throw new Error("summarize: timings array is empty");
  }

  const sorted = [...timings].sort((a, b) => a - b);
  const n = sorted.length;

  const min = sorted[0];
  const max = sorted[n - 1];
  if (min === undefined || max === undefined) {
    throw new Error("summarize: unreachable — sorted array missing endpoints");
  }

  const sum = sorted.reduce((acc, x) => acc + x, 0);
  const mean = sum / n;
  const variance = sorted.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    mean,
    stdDev,
    min,
    max,
    n,
  };
}

function percentile(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  if (n === 0) {
    throw new Error("percentile: empty input");
  }
  if (n === 1) {
    const only = sorted[0];
    if (only === undefined) throw new Error("percentile: unreachable");
    return only;
  }

  const rank = (p / 100) * (n - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const loVal = sorted[lo];
  const hiVal = sorted[hi];
  if (loVal === undefined || hiVal === undefined) {
    throw new Error("percentile: index out of bounds");
  }
  if (lo === hi) return loVal;
  return loVal + (hiVal - loVal) * (rank - lo);
}
