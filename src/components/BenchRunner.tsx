import { useMemo, useState } from "react";
import { runBench } from "@/lib/bench/run-bench";
import { summarize } from "@/lib/bench/summarize";
import { loremOfLength } from "@/lib/bench/text-fixtures";
import { canvasStrategy } from "@/lib/bench/strategies/canvas";
import { domStrategy } from "@/lib/bench/strategies/dom";
import { pretextStrategy } from "@/lib/bench/strategies/pretext";
import type { Strategy, StrategyName } from "@/lib/bench/strategies/types";
import {
  BenchResultsTable,
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
  const [prewarming, setPrewarming] = useState(false);
  const [prewarmed, setPrewarmed] = useState(false);

  const totalCells = textLengths.length * strategies.length;
  const doneCells = useMemo(
    () => Object.values(cells).filter((cell) => cell.kind === "done").length,
    [cells],
  );
  const errorCells = useMemo(
    () => Object.values(cells).filter((cell) => cell.kind === "error").length,
    [cells],
  );

  async function runAll() {
    setRunning(true);
    setCells(createInitialCells(strategies, textLengths));

    await waitForFonts();

    for (const strategyName of strategies) {
      for (const length of textLengths) {
        const key = keyFor(strategyName, length);

        try {
          const text = loremOfLength(length);
          const strategy = strategyMap[strategyName];

          setCells((current) => ({
            ...current,
            [key]: { kind: "running", phase: "warmup" },
          }));

          const { setupMs, measurer } = await strategy.prepareForText(text);

          setCells((current) => ({
            ...current,
            [key]: { kind: "running", phase: "iter" },
          }));

          const { timings } = await runBench(
            {
              measure: () => {
                measurer.measure(containerWidthPx);
              },
              teardown: () => {
                measurer.teardown?.();
              },
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

  async function prewarm() {
    setPrewarming(true);
    setPrewarmed(false);
    await waitForFonts();

    for (const strategyName of strategies) {
      for (const length of textLengths) {
        try {
          const text = loremOfLength(length);
          const strategy = strategyMap[strategyName];
          const { measurer } = await strategy.prepareForText(text);
          await runBench(
            {
              measure: () => {
                measurer.measure(containerWidthPx);
              },
              teardown: () => {
                measurer.teardown?.();
              },
            },
            { warmup: 0, iterations: 5, batchSize: 100, maxDurationMs: 500 },
          );
        } catch {
          // ignore errors during prewarm — it's best-effort
        }
        await waitForIdle();
      }
    }

    setPrewarming(false);
    setPrewarmed(true);
  }

  const statusText =
    errorCells > 0
      ? `${doneCells}/${totalCells} cells done, ${errorCells} failed`
      : `${doneCells}/${totalCells} cells done`;

  return (
    <div className="not-prose my-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={running || prewarming}
          onClick={() => {
            void prewarm();
          }}
          type="button"
        >
          {prewarming ? "Pre-warming…" : "Pre-warm"}
        </button>
        <button
          className="rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={running || prewarming}
          onClick={() => {
            void runAll();
          }}
          type="button"
        >
          {running ? "Running benchmark" : "Run benchmark"}
        </button>
        {prewarmed && !prewarming && (
          <span className="font-mono text-xs text-[var(--color-muted)]">✓ pre-warmed</span>
        )}
        <span className="font-mono text-xs text-[var(--color-muted)]">{statusText}</span>
      </div>
      <BenchResultsTable textLengths={textLengths} strategies={strategies} cells={cells} />
    </div>
  );
}
