import type {
  BenchSummary,
  CompareOpts,
  CompareResult,
} from "./types";

export function compare<K extends string>(
  results: Record<K, BenchSummary>,
  opts: CompareOpts = {},
): CompareResult<K> {
  const metric = opts.metric ?? "p50";
  const entries = Object.entries(results) as [K, BenchSummary][];

  if (entries.length === 0) {
    throw new Error("compare: results record is empty");
  }

  const first = entries[0];
  if (first === undefined) {
    throw new Error("compare: unreachable — entries length checked");
  }

  let baseline: K = first[0];
  let baselineValue: number = first[1][metric];

  for (const [name, summary] of entries) {
    const value = summary[metric];
    if (value > baselineValue) {
      baseline = name;
      baselineValue = value;
    }
  }

  const ratios = {} as Record<K, number>;
  for (const [name, summary] of entries) {
    ratios[name] = baselineValue / summary[metric];
  }

  return { baseline, metric, ratios };
}
