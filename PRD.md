# PRD — Pretext.js Benchmark Lab

**Status:** Stage 1 calibration complete; Stage 2 not started
**Last updated:** 2026-05-06
**Living document:** updated as decisions evolve

---

## 1. Summary

A public benchmarking lab for [Pretext.js](https://pretextjs.dev), measuring its claimed 300–600× speedup over DOM text measurement across realistic scenarios. Each experiment tests a single hypothesis with full methodology disclosure: percentiles instead of means, warm-up runs, batched timing, three browser engines, public calibration log.

Output is a single static site plus per-experiment write-ups. The project deliberately favors methodology over breadth. It is a research log, not a marketing site.

---

## 2. Problem and motivation

Pretext.js launched in March 2026 with a strong claim: 300–600× faster than `getBoundingClientRect`-based DOM measurement. The library has demos, a polished landing page, and an active author. What it does not have is an independent, methodologically transparent benchmark.

Most JS-perf claims in the wild rest on:
- Single-browser numbers, often Chrome only.
- Means rather than percentile distributions.
- Cherry-picked scenarios that match the library's strengths.
- No documentation of timer resolution, warm-up, JIT cold start, or build-mode effects.

This project closes that gap for one specific library, in a defensible way. The output is useful to engineers evaluating whether to adopt Pretext for production.

This is **not** a comparative review of layout libraries, a Pretext tutorial, or an attempt to discredit the library. The goal is honest measurement.

---

## 3. Goals

| # | Goal                                                                 |
|---|----------------------------------------------------------------------|
| 1 | Publish 6+ experiments, each testing a single hypothesis             |
| 2 | Maintain methodology defensible to senior-engineer review            |
| 3 | Run all final numbers in production builds across Chrome/FF/Safari   |
| 4 | Make calibration and methodology fully reproducible                  |

---

## 4. Non-goals

- Not a Pretext tutorial. Readers are assumed to know what the library does.
- Not a layout-engine comparison. The benchmark is Pretext vs DOM vs Canvas; not Pretext vs other libraries.
- Not a tool other people install. No npm package, no CI, no live benchmark service.
- Not a marketing channel for Pretext. The site reports honest results, including ones unfavorable to the library.
- Not a cross-device study. Single development machine is the only baseline. Mobile and low-end devices are out of scope for this version.
- Not a discussion of when to use Pretext. Conclusions per experiment, no architectural advice.

---

## 5. Target audience

- Senior and lead frontend engineers, especially those building chat/AI/virtualized UIs.
- Engineers evaluating Pretext for production use.
- The Pretext.js author and community — the methodology should hold up to their scrutiny.
- Developer-tooling enthusiasts following the post-React-Motion text-layout space.

---

## 6. Success criteria

The project is successful if all of the following hold by the end of stage 8:

1. Site is live at a stable URL with Lighthouse score ≥95 on all pages.
2. At least six experiments are published with honest numbers and inline conclusions.
3. Methodology page is detailed enough that a competent engineer can replicate the calibration locally.
4. Calibration log is public in the repo.
5. Findings (positive or negative) are received as substantive by knowledgeable readers in the layout/perf community.

---

## 7. Scope

### Experiments

Eight planned experiments, in order. Each is one page on the site.

| # | Experiment                       | Hypothesis                                                                                | Status      |
|---|----------------------------------|-------------------------------------------------------------------------------------------|-------------|
| 1 | Single measurement               | Pretext loses to DOM/Canvas on single-shot small inputs; wins on larger                   | Calibration complete |
| 2 | Bulk measurement (10k items)     | Pretext wins decisively in bulk; `prepare()` cost amortizes                               | Not started |
| 3 | Resize / relayout                | `prepare()` once + many `layout()` calls is where Pretext was designed to shine           | Not started |
| 4 | Streaming append (AI chat)       | Lower CLS than DOM-based ResizeObserver approach                                          | Not started |
| 5 | CPU throttled (4×, 6×)           | Performance gap widens on slower hardware                                                 | Not started |
| 6 | Multilingual (CJK + RTL)         | Pretext claim of universal-script support holds across realistic feed                     | Not started |
| 7 | Cold start                       | Pretext.prepare has significant first-call cost that breaks micro-bench claims            | Findings collected, write-up pending |
| 8 | Reproducibility runner (optional)| Reader can run the suite in their browser and submit results                              | Conditional |

### Per-experiment deliverables

- One MDX page (`src/content/experiments/NN-slug.mdx`).
- One React island (`BenchRunner` configured with experiment-specific strategies).
- Honest conclusion paragraph, written **after** seeing the numbers.

### Site structure

- `/` — homepage. Single-screen pitch, list of published experiments, link to methodology and GitHub.
- `/experiments/{slug}` — each experiment.
- `/methodology` — calibration approach, timer resolution, warm-up, percentiles, what was not measured.
- `/about` — one paragraph plus links.

### Out of scope explicitly

- Server-side rendering of bench results.
- Any kind of persistent leaderboard or user account.
- React/Vue/Svelte wrapper around Pretext.
- Bundler-size analysis.
- Comparison with other libraries beyond DOM/Canvas (text-layout, opentype.js, etc.).

---

## 8. Methodology principles

These are the rules every experiment follows. They are not negotiable for individual experiments — if an experiment can't be done within these rules honestly, it doesn't ship.

1. **Percentiles, not means.** Every cell reports p50, p95, p99. Means hide tail behavior.
2. **Warm-up before measurement.** 500 untimed runs before any timing starts.
3. **Batched timing for sub-µs operations.** 1000 measurements per timed batch, mean reported. Necessary because `performance.now()` resolution is 100µs in Chrome and 1ms in Firefox/Safari. Documented in methodology page.
4. **Three browser engines, never averaged.** Chrome (Blink), Firefox (Gecko), Safari (WebKit). Reported in three columns.
5. **Production builds for all final numbers.** Dev mode adds 40–50% overhead to DOM operations on small inputs. Calibration in Stage 1 established this.
6. **DevTools closed during measurement.** DevTools causes up to 70× degradation in tail latencies.
7. **Single hypothesis per experiment.** No combined "general comparison" tables.
8. **Honest disclosures.** Every limitation in scope or method is documented on the methodology page or in the experiment itself.
9. **Public calibration log.** All conditions tested, all variance numbers, in the repo.
10. **First-run is always cold; published numbers are warm.** Cold-start data is shown separately, framed as a feature of the library, not noise to hide.

---

## 9. Technical architecture

Deliberately minimal, chosen for the same performance discipline the project measures.

- **Framework:** Astro 5, `output: "static"`. React islands only where interactivity is needed (bench runners, charts). Result: near-zero JS on static pages.
- **Language:** TypeScript strict, `noUncheckedIndexedAccess: true`.
- **Styling:** Tailwind 4, no UI library, monospace-leaning aesthetic.
- **Charting (Stage 2+):** SVG, hand-drawn. No charting library. Decision deferred until experiment 1 numbers are stable.
- **Content:** MDX for experiment pages.
- **Testing:** Vitest for `src/lib/bench/` utilities. No E2E.
- **Package manager:** pnpm.
- **Deploy:** Vercel, static. COOP/COEP headers for slightly better Chrome timer resolution (5µs vs 100µs).
- **Source:** GitHub, public.

### Why Astro

- Zero-JS-by-default contradicts a perf-themed project on a heavy framework. Lighthouse 100 out of the box is part of the credibility.
- MDX-first content model fits research-log format.
- Compatible with React islands without the cost of full Next-style hydration.

### Repository layout

```
src/
  components/        # React islands (BenchRunner, ResultsTable, charts)
  layouts/           # Astro layouts
  pages/             # routing
  content/
    experiments/     # MDX files, one per experiment
  lib/
    bench/           # benchmarking utilities + per-strategy implementations
  styles/
notes/
  calibration.md     # the calibration log
docs/
  PRD.md             # this file
```

---

## 10. Milestones

### Phase 1: Foundation
- [x] Scaffold (Astro + React islands + MDX + Vitest)
- [x] Stage 1 single measurement experiment, full pipeline
- [x] Calibration across 7 conditions
- [ ] Pre-warm button
- [ ] Conclusion paragraph in Exp 1
- [ ] Methodology page draft
- [ ] First Vercel deploy + verify Lighthouse + verify COOP/COEP

**Milestone A — public launch:** site is live, one experiment published.

### Phase 2: Core experiments
- [ ] Stage 2: visualization (SVG charts)
- [ ] Exp 2: bulk measurement
- [ ] Exp 3: resize / relayout
- [ ] Exp 5: CPU throttled

**Milestone B — bulk launch:** four experiments published.

### Phase 3: Advanced experiments
- [ ] Exp 4: streaming chat
- [ ] Exp 6: multilingual
- [ ] Exp 7: cold start writeup

**Milestone C — full lab:** seven experiments and methodology page.

### Phase 4: Optional
- [ ] Exp 8: reproducibility runner. Only if Phase 3 lands well.

---

## 11. Risks and mitigations

| Risk                                                                | Mitigation                                                          |
|---------------------------------------------------------------------|---------------------------------------------------------------------|
| Scope creep before launch                                           | Ship Milestone A as soon as possible, even if minimal               |
| Overinvesting in visual polish                                      | Monospace-leaning aesthetic, no animation work, no design system    |
| Pretext author or community disputes numbers                        | Public calibration log, methodology defensible, all code in repo    |
| Pretext API changes mid-project                                     | Pin version, document the version under test                        |
| Optional stages absorb more time than budgeted                      | Stages 4 and 6 can be dropped if necessary; Stage 8 is conditional  |
| Numbers vary too much across re-runs after publication              | Acceptance check passed at ±2.9% in calibration; risk is low        |

---

## 12. Open questions

- Domain. Custom domain vs subdirectory of personal site vs no custom domain. Decision deferred to Milestone A.
- Whether Stage 8 (reproducibility runner) is worth the implementation cost. Decision deferred to after Milestone B.
- Mobile / low-end device coverage. Likely out of scope, but worth revisiting if the project gets traction.

---

## 13. Document history

| Date       | Change                                                              |
|------------|---------------------------------------------------------------------|
| 2026-05-06 | Initial draft, post-Stage-1 calibration                             |
