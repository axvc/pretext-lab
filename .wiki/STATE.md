# State

> Live snapshot of the project. Refreshed at the end of significant sessions and after Linear issues close.
>
> Last updated: 2026-05-10

---

## In progress

### Stage 2 calibration
- Stage 1 (`01-single-measurement`) is calibrated and published; Stage 2 is the next pipeline stage tracked in `notes/calibration.md`.
- Carried over from Stage 1: re-run the Firefox numbers against a production build (Stage 1 used dev-build numbers for Firefox).

### Further experiments
- Broaden coverage beyond a single measurement to more of the Pretext API surface — the `apis` field on each experiment records what's covered.

> Linear holds the authoritative task list; link issue IDs here as they're opened.

---

## Done (recent)

- Stage-1 calibration complete — 7 conditions (browsers, build modes, DevTools open/closed, incognito), logged in `notes/calibration.md`; cross-condition variance within target.
- Experiment 01 "Single measurement" published — DOM vs Canvas vs Pretext measuring the same text once at a fixed width.
- Benchmark pipeline hardened: batched timing in `runBench` / `BenchRunner`, Pretext strategy integrated.
- Site chrome: `ProseLayout` added (frontmatter-driven title/description), `methodology.mdx` written, favicon, README polish.

---

## On the horizon

- Stage 2 of the calibration pipeline and the experiments it unlocks.
- Possible new benchmark backends under `src/lib/bench/strategies/` as comparisons expand.
- UI: consider surfacing Pretext cold-start cost as a separate "pre-warm" action rather than folding it into setup timing.

---

## Open questions

- Calibration: do Firefox production-build numbers differ enough from the dev-build numbers used in Stage 1 to matter?
- Benchmark UX: should cold-start (prepare) cost get its own pre-warm control instead of being reported only as `setupMs`?
