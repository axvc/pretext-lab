# Decisions

> Log of architectural and product decisions, with rationale.
>
> Format: `## YYYY-MM — Short title` + Context + Decision + Rationale (optional) + Consequences.
> Newest entries on top.

---

## 2026-05 — Introducing the LLM Wiki layer

**Context**: The project reached a size where context between sessions and across agents started to get lost.

**Decision**: Add a `.wiki/` layer (Karpathy "LLM Wiki" pattern) with `STATE.md`, `DECISIONS.md`, `ARCHITECTURE.md`, plus `.claude/commands/` helpers.

**Consequences**: New ADR-level decisions are recorded here. `STATE.md` is refreshed at the end of significant sessions and after Linear issues close. `CLAUDE.md` points agents at the layer.

---

## 2026-05 — Published numbers come from production builds only

**Context**: During Stage-1 calibration, dev-mode runs (`pnpm dev`) inflated DOM measurements on small inputs by ~40–50% (Astro middleware, source maps, unminified runtime) while large inputs were unaffected — an asymmetric, misleading distortion. Canvas and Pretext were untouched because they don't hit the DOM.

**Decision**: Every published number must come from a production build (`pnpm build && pnpm preview`), with DevTools fully closed. Dev-mode and DevTools-open runs are kept only for methodological transparency, never as primary results.

**Consequences**: The calibration log records build mode per condition; the methodology page states the rule; experiment runs that don't meet it are invalid for publication.

---

## 2026-05 — Report three browser engines, never an average

**Context**: Blink, Gecko, and WebKit have materially different layout cost models — e.g. WebKit is ~2.7× faster than Blink on large-DOM measurement but ~4× slower on tiny inputs. An average across engines describes no real browser.

**Decision**: Cross-browser benchmarks always report three columns — Chrome (Blink), Firefox (Gecko), Safari (WebKit) — and never a blended number.

**Consequences**: Result tables and the methodology page are built around three-engine columns; single-browser results are flagged as partial.

---

## 2026-05 — Batched timing to work around `performance.now()` reduced precision

**Context**: Browsers clamp `performance.now()` resolution for Spectre mitigation (~100 µs in Chrome, ~1 ms in Firefox/Safari). Sub-microsecond operations (Pretext arithmetic, Canvas `measureText`) are unmeasurable per call — a naïve per-call timing loop produces all-zero cells.

**Decision**: `runBench` times batches of `batchSize` (default 1000) calls together and divides by `batchSize`; a `sink` accumulator checked against an impossible value (`0xDEADBEEF`) prevents V8 from eliminating the dead-code calls.

**Consequences**: `BenchRunner` and `run-bench.ts` carry `batchSize` through; the methodology page documents the run-loop construction; per-call costs below ~1 µs are now resolvable.

---

## 2026-05 — DOM text measurement appends to `document.body`

**Context**: Measuring text height with a detached DOM fragment is dramatically (and unrealistically) faster than measuring an element actually in the document — the layout engine does far less work on detached subtrees.

**Decision**: The DOM strategy creates a hidden, absolutely-positioned element, appends it to `document.body` to force a real layout pass, reads `offsetHeight`, then removes it.

**Consequences**: DOM numbers reflect real reflow cost (and real GC pressure / slow upward drift over many runs); the trade-off is documented inline in `strategies/dom.ts` and in Experiment 01.

---

## 2026-05 — Strategy interface for benchmark backends

**Context**: The lab compares several ways of measuring text layout (DOM, Canvas, Pretext) and will add more. Ad-hoc per-experiment runners would duplicate warmup/timing/teardown logic and make backends hard to swap.

**Decision**: Each backend implements a shared `Strategy` interface (`name`, `prepareForText(text) → { setupMs, measurer }`) under `src/lib/bench/strategies/`, registered in a `strategyMap` in `BenchRunner.tsx`. `runBench` itself is backend-agnostic.

**Consequences**: Adding a backend is one new file; experiments select backends by name; setup cost is reported uniformly via `setupMs`.

---

## 2026-05 — Static Astro, React only inside benchmark islands

**Context**: A benchmarking site that makes performance claims shouldn't ship a heavy framework runtime on its prose pages — the medium would undercut the message.

**Decision**: Build with Astro `output: "static"`; ship near-zero JS on static pages; use React (`@astrojs/react`) only for interactive benchmark islands, mounted with `client:load`.

**Rationale**: The constraint is a forcing function — "so I can't hide behind framework overhead while making performance claims" (README).

**Consequences**: Interactive work is confined to React island components; everything else is `.astro` / MDX; the bundle stays minimal on content pages.
