# Pretext.lab

A research-first benchmarking lab for [Pretext.js](https://pretextjs.dev) —
a recent text-layout library that claims 300–600× faster measurement than
the DOM. Each experiment in this repo is one hypothesis, one method, one
set of numbers.

> Site: https://pretext-lab.azverev.com
> Author: Artem Zverev

## Why this exists

Library benchmarks are usually marketing. This site is the opposite: every
experiment is reproducible in-browser, every method is documented, and every
non-measurement (what the numbers *don't* tell you) is called out
explicitly. The site itself is a forcing function — it ships near-zero JS
on static pages so I can't hide behind framework overhead while making
performance claims.

## Stack

- [Astro](https://astro.build) — `output: "static"`
- [React](https://react.dev) via `@astrojs/react`, used only for interactive
  benchmark islands
- [MDX](https://mdxjs.com) via `@astrojs/mdx` for experiment content
- [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite`
- TypeScript strict + `noUncheckedIndexedAccess`
- Vitest for unit tests of the benchmarking utilities
- pnpm, Node 22

## Run locally

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static site to ./dist
pnpm preview      # serve ./dist
pnpm test         # vitest run
pnpm check        # astro + tsc diagnostics
```

## How experiments are structured

Each experiment is an MDX file under `src/content/experiments/`, validated
against the Zod schema in `src/content.config.ts`:

```ts
{
  title: string;
  summary: string;
  order: number;
  status: "draft" | "published";
  apis: string[];   // Pretext APIs covered, e.g. ["measureText", "shape"]
}
```

Drafts show up on the homepage as "Coming soon" and are not linked.
Published experiments render through `src/pages/experiments/[...slug].astro`,
wrapped in `ExperimentLayout`. The interactive part (the actual benchmark
runner) is a per-experiment React island invoked with `client:load`.

## Benchmark utilities

`src/lib/bench/` exposes three pure functions used by every experiment
runner:

- `runBench(fn, opts)` — async; runs `warmup` discarded calls, then up to
  `iterations` timed calls, breaking early at `maxDurationMs`.
- `summarize(timings)` — `{ p50, p95, p99, mean, stdDev, min, max, n }`.
- `compare(results, opts)` — picks the slowest entry as baseline, returns
  ratios so faster candidates read as "X times faster than baseline".

Defaults: `warmup: 50`, `iterations: 1000`, `maxDurationMs: 5000`. Tested
in `*.test.ts` siblings.

## Layout

```
src/
  components/        # header, footer, cards, BenchRunner placeholder
  content/
    experiments/     # one MDX per experiment
  content.config.ts  # collection schema
  layouts/           # BaseLayout, ExperimentLayout
  lib/bench/         # the benchmarking primitives
  pages/             # index.astro, methodology.mdx, experiments/[...slug].astro
  styles/global.css  # Tailwind 4 + theme tokens
```
