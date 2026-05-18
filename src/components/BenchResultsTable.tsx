import type { BenchSummary } from "@/lib/bench/types";
import type { StrategyName } from "@/lib/bench/strategies/types";

export type CellState =
  | { kind: "pending" }
  | { kind: "running"; phase: "warmup" | "iter"; progress?: { current: number; total: number } }
  | { kind: "done"; summary: BenchSummary; setupMs: number }
  | { kind: "error"; message: string };

export type BenchCellKey = `${StrategyName}-${number}`;

const strategyLabels: Record<StrategyName, string> = {
  dom: "DOM",
  canvas: "Canvas",
  pretext: "Pretext",
};

const metrics: Array<[string, keyof Pick<BenchSummary, "p50" | "p95" | "p99">]> = [
  ["p50", "p50"],
  ["p95", "p95"],
  ["p99", "p99"],
];

function keyFor(strategy: StrategyName, length: number): BenchCellKey {
  return `${strategy}-${length}`;
}

function formatMicros(ms: number): string {
  return `${(ms * 1000).toFixed(2)} µs`;
}

type SingleSizeProps = {
  length: number;
  strategies: StrategyName[];
  cells: Record<BenchCellKey, CellState>;
  iterations?: number;
  onRetry?: (strategy: StrategyName) => void;
};

export function BenchResultsSingle({ length, strategies, cells, iterations, onRetry }: SingleSizeProps) {
  const bestP50 = strategies.reduce<number | null>((best, s) => {
    const cell = cells[keyFor(s, length)];
    if (cell?.kind === "done") {
      return best === null || cell.summary.p50 < best ? cell.summary.p50 : best;
    }
    return best;
  }, null);

  const caption = iterations
    ? `Results · ${length} chars · ${iterations.toLocaleString()} iterations`
    : `Results · ${length} chars`;

  return (
    <div>
      <p
        className="font-mono text-[11px] uppercase tracking-[1.6px] mb-3"
        style={{ color: "var(--color-muted)" }}
      >
        {caption}
      </p>

      <div style={{ borderTop: "1px solid var(--color-border)" }}>
        {/* Column headers */}
        <div
          className="flex font-mono text-[11px] pt-2 pb-2"
          style={{ color: "var(--color-dim)", borderBottom: "1px solid var(--color-border)" }}
        >
          <span className="flex-1" />
          <span className="w-28 text-right">p50</span>
          <span className="w-28 text-right">p95</span>
          <span className="w-28 text-right">p99</span>
        </div>

        {/* Strategy rows */}
        {strategies.map((strategy) => {
          const cell = cells[keyFor(strategy, length)] ?? { kind: "pending" as const };
          const isBest =
            cell.kind === "done" &&
            bestP50 !== null &&
            cell.summary.p50 === bestP50 &&
            strategies.length > 1;

          return (
            <div
              key={strategy}
              className="flex items-center font-mono text-[13px] py-3"
              style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-fg)" }}
            >
              <span className="flex-1">{strategyLabels[strategy]}</span>

              {cell.kind === "done" ? (
                metrics.map(([, metric]) => (
                  <span
                    key={metric}
                    className="w-28 text-right tabular-nums"
                    style={metric === "p50" && isBest ? { color: "var(--color-accent)" } : {}}
                  >
                    {formatMicros(cell.summary[metric])}
                  </span>
                ))
              ) : cell.kind === "running" ? (
                <>
                  <span className="w-28 text-right font-mono text-[11px]" style={{ color: "var(--color-dim)" }}>
                    {cell.progress
                      ? cell.phase === "warmup"
                        ? `Warming up… ${cell.progress.current} / ${cell.progress.total}`
                        : `Measuring… ${cell.progress.current} / ${cell.progress.total}`
                      : cell.phase === "warmup"
                        ? "warming…"
                        : "measuring…"}
                  </span>
                  <span className="w-28 text-right" style={{ color: "var(--color-dim)" }}>—</span>
                  <span className="w-28 text-right" style={{ color: "var(--color-dim)" }}>—</span>
                </>
              ) : cell.kind === "error" ? (
                <>
                  <span className="flex-1 text-[12px]" style={{ color: "var(--color-error)" }}>
                    {cell.message}
                  </span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(strategy)}
                      className="btn-tertiary font-mono text-[12px] shrink-0"
                      style={{ color: "var(--color-fg)", textDecorationColor: "var(--color-fg)" }}
                    >
                      [ Retry ]
                    </button>
                  )}
                </>
              ) : (
                metrics.map(([, metric]) => (
                  <span key={metric} className="w-28 text-right" style={{ color: "var(--color-dim)" }}>—</span>
                ))
              )}
            </div>
          );
        })}

        {/* Pretext prepare row — shows cold-start cost (setupMs) */}
        {strategies.includes("pretext") && (() => {
          const cell = cells[keyFor("pretext", length)];
          if (cell?.kind !== "done" && cell?.kind !== "running") return null;
          return (
            <div
              className="flex items-center font-mono text-[12px] py-2"
              style={{ color: "var(--color-dim)", borderBottom: "1px solid var(--color-border)" }}
            >
              <span className="flex-1">prepare</span>
              <span className="w-28 text-right tabular-nums">
                {cell.kind === "done" ? formatMicros(cell.setupMs) : "…"}
              </span>
              <span className="w-28" />
              <span className="w-28" />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
