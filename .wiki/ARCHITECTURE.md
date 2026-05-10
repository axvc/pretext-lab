# Architecture

> Current technical reality. Updated when stack, structure, or cross-cutting patterns change.
>
> Last updated: 2026-05-10

---

## Stack

- **Framework:** Astro 6 with `output: "static"` — the site builds to plain HTML in `./dist`
- **Interactive layer:** React 19 via `@astrojs/react`, used only for benchmark islands (`client:load`)
- **Content:** MDX via `@astrojs/mdx`; experiments live in an Astro content collection with a Zod schema
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`; theme tokens (`--color-*`) in `src/styles/global.css`
- **Language:** TypeScript, `astro/tsconfigs/strict` + `noUncheckedIndexedAccess`; `@/*` path alias → `src/*`
- **Library under test:** `@chenglou/pretext` — the text-layout library this lab benchmarks
- **Tests:** Vitest, unit tests for the `src/lib/bench` primitives only
- **Tooling:** pnpm 10, Node 22 (`.nvmrc`)

---

## Project shape

A single static Astro site. Two kinds of content: prose pages (`methodology.mdx`, the homepage) and MDX experiments, each of which embeds one interactive React benchmark island. No backend, no database.

---

## Structure

```
src/
  components/        SiteHeader, SiteFooter, ExperimentCard (Astro); BenchRunner, BenchResultsTable (React islands)
  content/
    experiments/     one MDX file per experiment, validated by the schema in content.config.ts
  content.config.ts  Zod schema for the `experiments` collection: title, summary, order, status, apis[]
  layouts/           BaseLayout (html shell + header/footer), ExperimentLayout (experiment chrome), ProseLayout (plain prose pages)
  lib/bench/         benchmarking primitives + strategies (see below)
  pages/             index.astro, methodology.mdx, experiments/[...slug].astro
  styles/global.css  Tailwind 4 import + CSS theme tokens
notes/
  calibration.md     pre-publication calibration log; one section per pipeline stage
public/              static assets (favicon)
```

`src/lib/bench/`:
- `run-bench.ts` — `runBench(fnOrSpec, opts)`: optional `setup`, untimed `warmup` calls, then `iterations` of `batchSize`-call timed batches; breaks early at `maxDurationMs`. Defaults: `warmup: 50, iterations: 1000, batchSize: 1000, maxDurationMs: 5000`.
- `summarize.ts` — `summarize(timings)` → `{ p50, p95, p99, mean, stdDev, min, max, n }`
- `compare.ts` — `compare(results, opts)` → ratios relative to the slowest entry, so faster candidates read as "N× faster than baseline"
- `text-fixtures.ts` — `loremOfLength(n)`, deterministic text fixtures
- `strategies/` — one module per measurement backend implementing the `Strategy` interface (`name`, `prepareForText(text) → { setupMs, measurer }`): `dom.ts`, `canvas.ts`, `pretext.ts`, plus shared `types.ts`

---

## Notable patterns

- **Static-first, JS only where needed.** Pages are static HTML; React ships only inside benchmark islands invoked with `client:load`. The zero-JS-on-prose constraint is deliberate — see DECISIONS.
- **Strategy pattern for benchmark backends.** Every measurement backend (DOM, Canvas, Pretext) implements the same `Strategy` interface and is registered in a `strategyMap` in `BenchRunner.tsx`. Adding a backend is one new file under `strategies/`.
- **Batched timing.** Timed loops measure batches of `batchSize` calls and divide, working around `performance.now()` reduced precision (~100 µs in Chrome, ~1 ms in Firefox/Safari). A `sink` accumulator checked against an impossible value prevents dead-code elimination of the measured call.
- **Content collection + Zod schema.** Experiments are MDX validated against `src/content.config.ts`; `draft` experiments render but aren't linked from the homepage.
- **Three-engine reporting.** Cross-browser results are always reported as three columns (Chrome / Firefox / Safari), never averaged — see DECISIONS and `methodology.mdx`.

---

## Deploy / Infra

Static site served at [pretext-lab.azverev.com](https://pretext-lab.azverev.com). No CI/CD workflow is committed; `.gitignore` lists `.vercel`, which points at Vercel for hosting. No analytics or monitoring SDKs are present. Build: `pnpm build` → `./dist`.

---

## Open technical decisions

- Firefox calibration numbers were collected against a dev build; spot-checking them against a production build is deferred to Stage 2 (see `notes/calibration.md`).
- Whether to surface Pretext's cold-start cost as a separate "pre-warm" action in the benchmark UI — cold start is ~18–30× the warm cost on short text.

---

## What is intentionally _not_ here

- Detailed component / module API docs — read the source
- The experiment backlog and roadmap items — those live in Linear
- Onboarding / setup steps — those belong in README.md
