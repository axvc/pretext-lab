import type { BenchOpts } from "./types";

const DEFAULTS = {
  warmup: 50,
  iterations: 1000,
  maxDurationMs: 5000,
} as const;

export async function runBench(
  fn: () => void | Promise<void>,
  opts: BenchOpts = {},
): Promise<number[]> {
  const warmup = opts.warmup ?? DEFAULTS.warmup;
  const iterations = opts.iterations ?? DEFAULTS.iterations;
  const maxDurationMs = opts.maxDurationMs ?? DEFAULTS.maxDurationMs;

  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  const timings: number[] = [];
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    if (performance.now() - start > maxDurationMs) break;
    const t0 = performance.now();
    await fn();
    timings.push(performance.now() - t0);
  }

  return timings;
}
