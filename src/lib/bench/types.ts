export type BenchOpts = {
  warmup?: number;
  iterations?: number;
  batchSize?: number;
  maxDurationMs?: number;
};

export type BenchSpec = {
  setup?: () => void | Promise<void>;
  measure: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
};

export type BenchResult = {
  setupMs: number | null;
  timings: number[];
};

export type BenchSummary = {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  n: number;
};

export type CompareMetric = "p50" | "p95" | "p99" | "mean";

export type CompareOpts = {
  metric?: CompareMetric;
};

export type CompareResult<K extends string> = {
  baseline: K;
  metric: CompareMetric;
  ratios: Record<K, number>;
};
