import { describe, expect, it } from "vitest";
import { runBench } from "./run-bench";

describe("runBench", () => {
  it("returns one timing per iteration when under maxDurationMs", async () => {
    const timings = await runBench(() => {}, {
      warmup: 5,
      iterations: 20,
      batchSize: 1,
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
      { warmup: 7, iterations: 13, batchSize: 1, maxDurationMs: 5000 },
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
      { warmup: 2, iterations: 5, batchSize: 1, maxDurationMs: 5000 },
    );
    expect(resolved).toBe(7);
  });

  it("exits early when maxDurationMs is exceeded", async () => {
    const timings = await runBench(
      () => new Promise((r) => setTimeout(r, 10)),
      { warmup: 0, iterations: 1000, batchSize: 1, maxDurationMs: 50 },
    );
    expect(timings.length).toBeLessThan(1000);
  });
});

describe("runBench (spec form)", () => {
  it("returns { setupMs, timings } and runs all phases in order", async () => {
    const order: string[] = [];
    let measureCalls = 0;

    const result = await runBench(
      {
        setup: () => {
          order.push("setup");
        },
        measure: () => {
          if (!order.includes("measure")) order.push("measure");
          measureCalls += 1;
        },
        teardown: () => {
          order.push("teardown");
        },
      },
      { warmup: 3, iterations: 5, batchSize: 1, maxDurationMs: 5000 },
    );

    expect(order).toEqual(["setup", "measure", "teardown"]);
    expect(measureCalls).toBe(3 + 5);
    expect(result.timings).toHaveLength(5);
    expect(typeof result.setupMs).toBe("number");
  });

  it("setupMs is null when no setup is provided", async () => {
    const result = await runBench(
      { measure: () => {} },
      { warmup: 1, iterations: 2, batchSize: 1, maxDurationMs: 5000 },
    );
    expect(result.setupMs).toBeNull();
    expect(result.timings).toHaveLength(2);
  });

  it("setupMs reflects the duration of setup only", async () => {
    const result = await runBench(
      {
        setup: () => new Promise<void>((resolve) => setTimeout(resolve, 50)),
        measure: () => {},
      },
      { warmup: 0, iterations: 2, batchSize: 1, maxDurationMs: 5000 },
    );
    expect(result.setupMs).not.toBeNull();
    expect(result.setupMs as number).toBeGreaterThanOrEqual(40);
  });

  it("calls teardown exactly once even when iterations early-exit", async () => {
    let teardownCalls = 0;
    const result = await runBench(
      {
        measure: () => new Promise<void>((resolve) => setTimeout(resolve, 5)),
        teardown: () => {
          teardownCalls += 1;
        },
      },
      { warmup: 0, iterations: 1000, batchSize: 1, maxDurationMs: 30 },
    );
    expect(teardownCalls).toBe(1);
    expect(result.timings.length).toBeLessThan(1000);
  });
});

describe("runBench (batched timing)", () => {
  it("timings.length equals iterations regardless of batchSize", async () => {
    const result = await runBench(
      { measure: () => {} },
      { warmup: 0, iterations: 8, batchSize: 50, maxDurationMs: 5000 },
    );
    expect(result.timings).toHaveLength(8);
  });

  it("total measure calls = warmup + iterations × batchSize", async () => {
    let calls = 0;
    await runBench(
      { measure: () => { calls++; } },
      { warmup: 3, iterations: 4, batchSize: 10, maxDurationMs: 5000 },
    );
    expect(calls).toBe(3 + 4 * 10);
  });
});
