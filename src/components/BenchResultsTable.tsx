import type { BenchSummary } from "@/lib/bench/types";
import type { StrategyName } from "@/lib/bench/strategies/types";

export type CellState =
  | { kind: "pending" }
  | { kind: "running"; phase: "warmup" | "iter" }
  | { kind: "done"; summary: BenchSummary; setupMs: number }
  | { kind: "error"; message: string };

export type BenchCellKey = `${StrategyName}-${number}`;

type Props = {
  textLengths: number[];
  strategies: StrategyName[];
  cells: Record<BenchCellKey, CellState>;
};

const strategyLabels: Record<StrategyName, string> = {
  dom: "DOM",
  canvas: "Canvas",
  pretext: "Pretext",
};

const summaryRows: Array<[string, keyof Pick<BenchSummary, "p50" | "p95" | "p99">]> = [
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

function statusLabel(cell: CellState): string {
  if (cell.kind === "running") {
    return cell.phase === "warmup" ? "warming up" : "running";
  }
  if (cell.kind === "error") return cell.message;
  if (cell.kind === "done") return "done";
  return "queued";
}

function PrepareCell({ cell }: { cell: CellState }) {
  if (cell.kind === "done") {
    return <span className="font-mono tabular-nums">{formatMicros(cell.setupMs)}</span>;
  }

  if (cell.kind === "error") {
    return <span className="text-xs text-red-500">{cell.message}</span>;
  }

  return <span className="text-xs text-[var(--color-muted)]">{statusLabel(cell)}</span>;
}

function ResultCell({ cell }: { cell: CellState }) {
  if (cell.kind === "done") {
    return (
      <div className="grid gap-1 font-mono text-xs tabular-nums">
        {summaryRows.map(([label, metric]) => (
          <div className="flex min-w-32 justify-between gap-4" key={metric}>
            <span className="text-[var(--color-muted)]">{label}</span>
            <span>{formatMicros(cell.summary[metric])}</span>
          </div>
        ))}
      </div>
    );
  }

  if (cell.kind === "error") {
    return <span className="text-xs text-red-500">{cell.message}</span>;
  }

  return <span className="text-xs text-[var(--color-muted)]">{statusLabel(cell)}</span>;
}

export function BenchResultsTable({ textLengths, strategies, cells }: Props) {
  const showPrepareRow = strategies.includes("pretext");

  return (
    <div className="not-prose my-6 overflow-x-auto rounded-md border border-[var(--color-border)]">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
          <tr>
            <th className="w-40 px-4 py-3 font-mono font-medium">strategy</th>
            {textLengths.map((length) => (
              <th className="border-l border-[var(--color-border)] px-4 py-3 font-mono font-medium" key={length}>
                {length} chars
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {showPrepareRow && (
            <tr className="bg-[var(--color-accent-soft)]">
              <th className="px-4 py-4 font-mono text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Pretext prepare
              </th>
              {textLengths.map((length) => (
                <td className="border-l border-[var(--color-border)] px-4 py-4 align-top" key={length}>
                  <PrepareCell cell={cells[keyFor("pretext", length)] ?? { kind: "pending" }} />
                </td>
              ))}
            </tr>
          )}
          {strategies.map((strategy) => (
            <tr key={strategy}>
              <th className="px-4 py-4 font-medium">{strategyLabels[strategy]}</th>
              {textLengths.map((length) => (
                <td className="border-l border-[var(--color-border)] px-4 py-4 align-top" key={length}>
                  <ResultCell cell={cells[keyFor(strategy, length)] ?? { kind: "pending" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
