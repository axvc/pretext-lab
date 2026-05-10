import { useMemo, useState } from "react";
import { runBench } from "@/lib/bench/run-bench";
import { summarize } from "@/lib/bench/summarize";
import { loremOfLength } from "@/lib/bench/text-fixtures";
import { canvasStrategy } from "@/lib/bench/strategies/canvas";
import { domStrategy } from "@/lib/bench/strategies/dom";
import { pretextStrategy } from "@/lib/bench/strategies/pretext";
import type { Strategy, StrategyName } from "@/lib/bench/strategies/types";
import {
  BenchResultsSingle,
  type BenchCellKey,
  type CellState,
} from "@/components/BenchResultsTable";

type Props = {
  textLengths?: number[];
  strategies?: StrategyName[];
  containerWidthPx?: number;
  warmup?: number;
  iterations?: number;
};

const defaultTextLengths = [10, 100, 1000, 5000];
const defaultStrategies: StrategyName[] = ["dom", "canvas", "pretext"];

const strategyMap: Record<StrategyName, Strategy> = {
  dom: domStrategy,
  canvas: canvasStrategy,
  pretext: pretextStrategy,
};

const strategyLabels: Record<StrategyName, string> = {
  dom: "DOM",
  canvas: "Canvas",
  pretext: "Pretext",
};

function keyFor(strategy: StrategyName, length: number): BenchCellKey {
  return `${strategy}-${length}`;
}

function createInitialCells(
  strategies: StrategyName[],
  textLengths: number[],
): Record<BenchCellKey, CellState> {
  const cells = {} as Record<BenchCellKey, CellState>;
  for (const strategy of strategies) {
    for (const length of textLengths) {
      cells[keyFor(strategy, length)] = { kind: "pending" };
    }
  }
  return cells;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function waitForIdle(): Promise<void> {
  return new Promise((resolve) => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
    };
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => resolve());
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

async function waitForFonts(): Promise<void> {
  if ("fonts" in document) {
    await document.fonts.ready;
  }
}

export function BenchRunner({
  textLengths = defaultTextLengths,
  strategies = defaultStrategies,
  containerWidthPx = 600,
  warmup = 500,
  iterations = 1000,
}: Props) {
  const [cells, setCells] = useState<Record<BenchCellKey, CellState>>(() =>
    createInitialCells(strategies, textLengths),
  );
  const [running, setRunning] = useState(false);
  const [selectedLength, setSelectedLength] = useState(textLengths[2] ?? textLengths[0]!);
  const [activeStrategies, setActiveStrategies] = useState<Set<StrategyName>>(
    new Set(strategies),
  );

  function hasDataFor(length: number): boolean {
    return [...activeStrategies].some((s) => cells[keyFor(s, length)]?.kind === "done");
  }

  function hasResultsFor(length: number): boolean {
    return [...activeStrategies].some(
      (s) => cells[keyFor(s, length)]?.kind === "done" || cells[keyFor(s, length)]?.kind === "running",
    );
  }

  const runningLength = useMemo(() => {
    for (const length of textLengths) {
      for (const s of activeStrategies) {
        if (cells[keyFor(s, length)]?.kind === "running") return length;
      }
    }
    return null;
  }, [cells, textLengths, activeStrategies]);

  const doneCells = useMemo(
    () => Object.values(cells).filter((c) => c.kind === "done").length,
    [cells],
  );

  const totalRunningCells = useMemo(
    () => [...activeStrategies].length * textLengths.length,
    [activeStrategies, textLengths],
  );

  const errorCells = useMemo(
    () => Object.values(cells).filter((c) => c.kind === "error").length,
    [cells],
  );

  function toggleStrategy(s: StrategyName) {
    setActiveStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size > 1) next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  }

  async function runBenchmark(lengths: number[]) {
    setRunning(true);
    setCells(createInitialCells(strategies, textLengths));
    await waitForFonts();

    for (const strategyName of strategies) {
      if (!activeStrategies.has(strategyName)) continue;
      for (const length of lengths) {
        const key = keyFor(strategyName, length);
        try {
          const text = loremOfLength(length);
          const strategy = strategyMap[strategyName];

          setCells((current) => ({ ...current, [key]: { kind: "running", phase: "warmup" } }));
          const { setupMs, measurer } = await strategy.prepareForText(text);
          setCells((current) => ({ ...current, [key]: { kind: "running", phase: "iter" } }));

          const { timings } = await runBench(
            {
              measure: () => { measurer.measure(containerWidthPx); },
              teardown: () => { measurer.teardown?.(); },
            },
            { warmup, iterations },
          );

          setCells((current) => ({
            ...current,
            [key]: { kind: "done", summary: summarize(timings), setupMs },
          }));
        } catch (error) {
          setCells((current) => ({
            ...current,
            [key]: { kind: "error", message: errorMessage(error) },
          }));
        }
        await waitForIdle();
      }
    }

    setRunning(false);
  }

  async function preWarm() {
    setRunning(true);
    await waitForFonts();
    for (const strategyName of strategies) {
      if (!activeStrategies.has(strategyName)) continue;
      for (const length of [selectedLength]) {
        const text = loremOfLength(length);
        const strategy = strategyMap[strategyName];
        try {
          const { measurer } = await strategy.prepareForText(text);
          await runBench(
            { measure: () => { measurer.measure(containerWidthPx); }, teardown: () => { measurer.teardown?.(); } },
            { warmup: 100, iterations: 1 },
          );
        } catch {}
        await waitForIdle();
      }
    }
    setRunning(false);
  }

  const statusText = running
    ? `${doneCells}/${totalRunningCells} done${errorCells > 0 ? `, ${errorCells} failed` : ""}…`
    : errorCells > 0
      ? `${errorCells} failed`
      : "";

  return (
    <div id="bench" className="not-prose my-10">
      <div
        className="rounded-lg p-8 max-w-[700px]"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p
            className="font-mono text-[11px] uppercase tracking-[1.6px]"
            style={{ color: "var(--color-muted)" }}
          >
            Bench · {iterations.toLocaleString()} iterations
          </p>
          {statusText && (
            <p className="font-mono text-[11px]" style={{ color: "var(--color-dim)" }}>
              {statusText}
            </p>
          )}
        </div>

        {/* Size selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {textLengths.map((length) => {
              const isSelected = length === selectedLength;
              const isRunningThis = runningLength === length;
              const hasDone = hasDataFor(length);
              return (
                <button
                  key={length}
                  type="button"
                  disabled={running}
                  onClick={() => setSelectedLength(length)}
                  className="w-16 h-8 font-mono text-[13px] disabled:cursor-not-allowed transition-colors"
                  style={{
                    border: isSelected
                      ? "1px solid var(--color-accent)"
                      : hasDone
                        ? "1px solid var(--color-muted)"
                        : "1px solid var(--color-border)",
                    color: isSelected
                      ? "var(--color-fg)"
                      : hasDone || isRunningThis
                        ? "var(--color-muted)"
                        : "var(--color-dim)",
                    background: "transparent",
                    cursor: running ? "not-allowed" : "pointer",
                  }}
                >
                  {isRunningThis && running ? "…" : length}
                </button>
              );
            })}
          </div>

          {/* Strategy toggles */}
          <div className="flex gap-5">
            {strategies.map((s) => {
              const checked = activeStrategies.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={running}
                  onClick={() => toggleStrategy(s)}
                  className="flex items-center gap-2 font-mono text-[13px] disabled:opacity-40"
                  style={{
                    color: checked ? "var(--color-fg)" : "var(--color-muted)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: running ? "not-allowed" : "pointer",
                  }}
                >
                  <span
                    className="inline-block w-3 h-3 shrink-0"
                    style={{
                      background: checked ? "var(--color-accent)" : "transparent",
                      border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  />
                  {strategyLabels[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col gap-2 flex-1">
            <button
              type="button"
              disabled={running}
              onClick={() => void preWarm()}
              className="h-12 w-full font-mono text-[14px] disabled:opacity-40"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-muted)",
                background: "transparent",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              [ Pre-warm ]
            </button>
            <p className="font-mono text-[11px]" style={{ color: "var(--color-dim)" }}>
              Recommended before first run
            </p>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <button
              type="button"
              disabled={running}
              onClick={() => void runBenchmark([selectedLength])}
              className="h-12 w-full font-mono text-[14px] disabled:opacity-40"
              style={{
                border: "1.5px solid var(--color-accent)",
                color: "var(--color-fg)",
                background: "transparent",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {running && runningLength === selectedLength ? "Running…" : "[ Run benchmark ]"}
            </button>
            <p className="font-mono text-[11px]" style={{ color: "var(--color-dim)" }}>
              First run includes cold-start cost
            </p>
          </div>
        </div>

        {/* Run all sizes */}
        <div className="mb-6">
          <button
            type="button"
            disabled={running}
            onClick={() => void runBenchmark(textLengths)}
            className="font-mono text-[11px] disabled:opacity-40"
            style={{
              color: "var(--color-dim)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: running ? "not-allowed" : "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {running ? "Running…" : "[ Run all sizes ]"}
          </button>
        </div>

        {/* Results — always inside panel, for selectedLength */}
        {hasResultsFor(selectedLength) && (
          <BenchResultsSingle
            length={selectedLength}
            strategies={[...activeStrategies]}
            cells={cells}
            iterations={iterations}
          />
        )}
      </div>
    </div>
  );
}
