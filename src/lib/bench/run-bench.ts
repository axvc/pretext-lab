import type { BenchOpts, BenchResult, BenchSpec } from "./types";

// performance.now() has reduced precision (~100µs in Chrome) due to Spectre mitigations:
// https://developer.mozilla.org/en-US/docs/Web/API/Performance/now#reduced_time_precision
// Batching amortises the overhead: time batchSize calls together and divide by batchSize.
const DEFAULTS = {
  warmup: 50,
  iterations: 1000,
  batchSize: 1000,
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
  const batchSize = opts.batchSize ?? DEFAULTS.batchSize;
  const maxDurationMs = opts.maxDurationMs ?? DEFAULTS.maxDurationMs;

  let setupMs: number | null = null;
  if (spec.setup) {
    const t0 = performance.now();
    await spec.setup();
    setupMs = performance.now() - t0;
  }

  const timings: number[] = [];
  let sink = 0;

  try {
    for (let i = 0; i < warmup; i++) {
      sink += Number(await spec.measure()) | 0;
    }

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      if (performance.now() - start > maxDurationMs) break;
      const t0 = performance.now();
      for (let j = 0; j < batchSize; j++) {
        sink += Number(await spec.measure()) | 0;
      }
      timings.push((performance.now() - t0) / batchSize);
    }
    if (sink === 0xDEADBEEF) console.log(sink);
  } finally {
    await spec.teardown?.();
  }

  return isLegacy ? timings : { setupMs, timings };
}
