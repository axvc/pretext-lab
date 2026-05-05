import type { BenchOpts, BenchResult, BenchSpec } from "./types";

const DEFAULTS = {
  warmup: 50,
  iterations: 1000,
  maxDurationMs: 5000,
} as const;

export async function runBench(
  fn: () => void | Promise<void>,
  opts?: BenchOpts,
): Promise<number[]>;
export async function runBench(
  spec: BenchSpec,
  opts?: BenchOpts,
): Promise<BenchResult>;
export async function runBench(
  arg: (() => void | Promise<void>) | BenchSpec,
  opts: BenchOpts = {},
): Promise<number[] | BenchResult> {
  const isLegacy = typeof arg === "function";
  const spec: BenchSpec = isLegacy ? { measure: arg } : arg;

  const warmup = opts.warmup ?? DEFAULTS.warmup;
  const iterations = opts.iterations ?? DEFAULTS.iterations;
  const maxDurationMs = opts.maxDurationMs ?? DEFAULTS.maxDurationMs;

  let setupMs: number | null = null;
  if (spec.setup) {
    const t0 = performance.now();
    await spec.setup();
    setupMs = performance.now() - t0;
  }

  const timings: number[] = [];

  try {
    for (let i = 0; i < warmup; i++) {
      await spec.measure();
    }

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      if (performance.now() - start > maxDurationMs) break;
      const t0 = performance.now();
      await spec.measure();
      timings.push(performance.now() - t0);
    }
  } finally {
    await spec.teardown?.();
  }

  return isLegacy ? timings : { setupMs, timings };
}
