import { describe, expect, it } from "vitest";
import { runBench } from "./run-bench";

describe("runBench", () => {
  it("returns one timing per iteration when under maxDurationMs", async () => {
    const timings = await runBench(() => {}, {
      warmup: 5,
      iterations: 20,
      maxDurationMs: 5000,
    });
    expect(timings).toHaveLength(20);
    for (const t of timings) {
      expect(typeof t).toBe("number");
      expect(t).toBeGreaterThanOrEqual(0);
    }
  });

  it("invokes fn warmup + n times where n = timings.length", async () => {
    let calls = 0;
    const timings = await runBench(
      () => {
        calls += 1;
      },
      { warmup: 7, iterations: 13, maxDurationMs: 5000 },
    );
    expect(calls).toBe(7 + timings.length);
    expect(timings).toHaveLength(13);
  });

  it("awaits async functions", async () => {
    let resolved = 0;
    await runBench(
      async () => {
        await Promise.resolve();
        resolved += 1;
      },
      { warmup: 2, iterations: 5, maxDurationMs: 5000 },
    );
    expect(resolved).toBe(7);
  });

  it("exits early when maxDurationMs is exceeded", async () => {
    const timings = await runBench(
      () => new Promise((r) => setTimeout(r, 10)),
      { warmup: 0, iterations: 1000, maxDurationMs: 50 },
    );
    expect(timings.length).toBeLessThan(1000);
  });
});
