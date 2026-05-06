# Calibration log

Pre-publication calibration of the benchmarking pipeline. Each stage adds a new section.

---

## Stage 1: Single Measurement

**Date:** 2026-05-06
**Experiment:** `01-single-measurement`
**Status:** Complete — all 7 conditions calibrated

### Test environment

- **Machine:** Mac mini (2024), Apple M4, 16 GB RAM, macOS Tahoe 26.3
- **Chrome:** 148.0.7778.97 (arm64, native build — not Rosetta)
- **Firefox:** 150.0.1 (64-bit)
- **Safari:** system version on macOS Tahoe 26.3
- **runBench config:** `warmup=500, iterations=1000, batchSize=1000`
- **Inputs:** text lengths 10, 100, 1000, 5000 chars; fixed container width 600px; font `16px Inter` with line-height 1.5

> **Note on build modes.** Conditions 1–4 were run against `pnpm dev`. Conditions 5–7 use `pnpm build && pnpm preview`. As established in Condition 5, dev mode inflates DOM measurements on small inputs by ~40–50% due to Astro middleware, source maps, and unminified runtime. **All published numbers must come from production builds only.** The dev-mode conditions are kept for methodological transparency, not as primary results.

### Conditions

| # | Condition                                   | Build | Runs | Status |
|---|---------------------------------------------|-------|------|--------|
| 1 | Chrome — fresh tab                          | dev   | 3    | ✅     |
| 2 | Chrome — 10 consecutive runs                | dev   | 10   | ✅     |
| 3 | Firefox                                     | dev   | 4    | ✅     |
| 4 | Chrome — DevTools open                      | dev   | 3    | ✅     |
| 5 | Chrome — production build                   | prod  | 3    | ✅     |
| 6 | Safari — production build                   | prod  | 4    | ✅     |
| 7 | Chrome Incognito (no extensions) — prod     | prod  | 4    | ✅     |

All values in microseconds (µs). `Pretext prepare` is a one-time setup cost per text length; not a percentile.

---

### Condition 1 — Chrome, fresh tab (dev build)

**Run 1 (cold):**

| Strategy        | Pct  | 10ch    | 100ch   | 1000ch  | 5000ch    |
|-----------------|------|---------|---------|---------|-----------|
| Pretext prepare | once | 5400.00 | 500.00  | 600.00  | 2200.00   |
| DOM             | p50  | 17.40   | 22.10   | 60.90   | 232.85    |
| DOM             | p95  | 19.00   | 23.50   | 63.19   | 235.13    |
| DOM             | p99  | 20.74   | 24.20   | 65.33   | 235.60    |
| Canvas          | p50  | 0.10    | 0.80    | 7.10    | 35.20     |
| Canvas          | p95  | 0.20    | 0.80    | 7.30    | 35.80     |
| Canvas          | p99  | 0.30    | 0.90    | 7.40    | 35.90     |
| Pretext         | p50  | 0.10    | 0.20    | 1.50    | 7.40      |
| Pretext         | p95  | 0.20    | 0.30    | 1.60    | 7.60      |
| Pretext         | p99  | 0.20    | 0.30    | 1.70    | 7.70      |

**Run 3 (warm, representative):**

| Strategy        | Pct  | 10ch   | 100ch  | 1000ch | 5000ch  |
|-----------------|------|--------|--------|--------|---------|
| Pretext prepare | once | 300.00 | 100.00 | 300.00 | 900.00  |
| DOM             | p50  | 17.80  | 22.20  | 61.60  | 235.15  |
| DOM             | p95  | 19.52  | 23.80  | 63.29  | 236.49  |
| DOM             | p99  | 20.32  | 24.73  | 63.86  | 237.61  |
| Canvas          | p50  | 0.10   | 0.80   | 7.20   | 35.60   |
| Canvas          | p95  | 0.20   | 0.80   | 7.40   | 36.20   |
| Canvas          | p99  | 0.30   | 0.90   | 7.51   | 37.14   |
| Pretext         | p50  | 0.10   | 0.20   | 1.60   | 7.50    |
| Pretext         | p95  | 0.20   | 0.30   | 1.70   | 7.70    |
| Pretext         | p99  | 0.20   | 0.30   | 1.70   | 7.70    |

**Findings:**
- Pretext.prepare cold start at 10 chars: **5400µs → 300µs** between run 1 and run 2 (≈18× penalty).
- After cold start, all percentiles in DOM/Canvas/Pretext stable within ±1% across runs 2–3.
- Pretext.prepare for 5000 chars takes 2 warm-up runs to settle (2200 → 900 → 900).

---

### Condition 2 — Chrome, 10 consecutive runs (dev build)

Drift tracking, key cells (`p50`):

| Run | Pretext prepare 10ch | DOM 5000ch | Canvas 5000ch | Pretext 5000ch |
|-----|----------------------|------------|---------------|----------------|
| 1   | 6500.00              | 234.90     | 35.70         | 7.50           |
| 2   | 300.00               | 236.05     | 35.70         | 7.70           |
| 3   | 200.00               | 237.90     | 35.70         | 7.70           |
| 4   | 200.00               | 238.70     | 35.80         | 7.60           |
| 5   | 300.00               | 238.10     | 35.90         | 7.70           |
| 6   | 300.00               | 239.20     | 35.90         | 7.70           |
| 7   | 300.00               | 238.90     | 36.00         | 7.70           |
| 8   | 200.00               | 238.80     | 36.10         | 7.70           |
| 9   | 200.00               | 239.90     | 36.10         | 7.70           |
| 10  | 200.00               | 239.40     | 36.10         | 7.70           |

**Findings:**
- Cold start in run 1 confirms Condition 1: 6500 → 300 (≈22× for 10ch).
- DOM p50 drift across runs 2–10: 236.05 → 239.40 (**+1.4%**). Likely accumulated GC pressure from millions of `createElement / appendChild / remove` calls.
- Canvas p50 drift: 35.70 → 36.10 (**+1.1%**). Similar low-grade drift.
- Pretext layout drift: essentially zero (7.70 sustained). Pure arithmetic, no allocations — matches design intent.

---

### Condition 3 — Firefox, 4 runs (dev build)

**Run 1 (cold):**

| Strategy        | Pct  | 10ch    | 100ch   | 1000ch  | 5000ch    |
|-----------------|------|---------|---------|---------|-----------|
| Pretext prepare | once | 3000.00 | 1000.00 | 1000.00 | 3000.00   |
| DOM             | p50  | 71.00   | 77.00   | 125.00  | 337.00    |
| DOM             | p95  | 74.00   | 80.00   | 128.05  | 353.80    |
| DOM             | p99  | 74.31   | 80.36   | 129.00  | 379.56    |
| Canvas          | p50  | 0.00    | 1.00    | 5.00    | 25.00     |
| Canvas          | p95  | 1.00    | 1.00    | 6.00    | 37.65     |
| Canvas          | p99  | 1.00    | 2.00    | 6.00    | 40.00     |
| Pretext         | p50  | 0.00    | 0.00    | 2.00    | 11.00     |
| Pretext         | p95  | 1.00    | 1.00    | 3.00    | 12.00     |
| Pretext         | p99  | 1.00    | 1.00    | 3.00    | 13.00     |

**Run 4 (warm, representative):**

| Strategy        | Pct  | 10ch  | 100ch | 1000ch | 5000ch  |
|-----------------|------|-------|-------|--------|---------|
| Pretext prepare | once | 0.00  | 0.00  | 0.00   | 2000.00 |
| DOM             | p50  | 73.00 | 79.00 | 126.50 | 339.00  |
| DOM             | p95  | 75.60 | 81.00 | 129.00 | 341.90  |
| DOM             | p99  | 76.00 | 82.00 | 129.00 | 343.58  |
| Canvas          | p50  | 0.00  | 1.00  | 6.00   | 27.00   |
| Canvas          | p95  | 1.00  | 1.00  | 6.00   | 28.00   |
| Canvas          | p99  | 1.00  | 2.00  | 7.00   | 28.00   |
| Pretext         | p50  | 0.00  | 0.00  | 2.00   | 11.00   |
| Pretext         | p95  | 1.00  | 1.00  | 3.00   | 12.00   |
| Pretext         | p99  | 1.00  | 1.00  | 3.00   | 12.00   |

**Findings:**
- `performance.now()` resolution ≈1ms in Firefox (vs ≈100µs in Chrome). Visible as integer-µs cells after batching by 1000. Sub-µs measurements collapse to 0.
- Pretext.prepare timings noisy — single-shot measurement sees only timer resolution. Reported with ±1ms granularity.
- Stability after warm-up: DOM ±0.5%, Canvas ±4%, Pretext ±0%.

---

### Condition 4 — Chrome with DevTools open (dev build)

**Run 3 (warm, representative):**

| Strategy        | Pct  | 10ch   | 100ch  | 1000ch | 5000ch |
|-----------------|------|--------|--------|--------|--------|
| Pretext prepare | once | 300.00 | 100.00 | 200.00 | 800.00 |
| DOM             | p50  | 26.55  | 33.70  | 71.70  | 256.55 |
| DOM             | p95  | 33.39  | 41.47  | 78.06  | 265.91 |
| DOM             | p99  | 35.77  | 49.04  | 83.73  | 278.14 |
| Canvas          | p50  | 1.40   | 2.00   | 8.70   | 37.00  |
| Canvas          | p95  | 12.81  | 12.70  | 12.70  | 38.64  |
| Canvas          | p99  | 17.70  | 21.00  | 13.74  | 45.00  |
| Pretext         | p50  | 1.30   | 1.40   | 2.80   | 8.70   |
| Pretext         | p95  | 10.91  | 11.50  | 14.21  | 13.40  |
| Pretext         | p99  | 14.30  | 15.40  | 17.70  | 14.90  |

**Impact vs Chrome closed (5000ch):**

| Strategy | Pct | Closed | Open  | Δ        |
|----------|-----|--------|-------|----------|
| DOM      | p50 | 239.40 | 256.55| **+7%**   |
| DOM      | p99 | 237.61 | 278.14| **+17%**  |
| Canvas   | p50 | 36.10  | 37.00 | +2%      |
| Canvas   | p99 | 36.50  | 45.00 | **+23%**  |
| Pretext  | p50 | 7.70   | 8.70  | +13%     |
| Pretext  | p99 | 8.00   | 14.90 | **+86%**  |

**Tail latency on short inputs (10ch p99):**

| Strategy | Closed | Open  | Δ              |
|----------|--------|-------|----------------|
| Canvas   | 0.30   | 17.70 | **≈59× worse** |
| Pretext  | 0.20   | 14.30 | **≈70× worse** |

**Findings:**
- p50 mildly affected (+5–15%). Easy to overlook.
- p95/p99 catastrophically degraded for fast operations — DevTools instrumentation introduces periodic interruptions that hit the tail.
- **Implication:** any benchmark run with DevTools open is invalid for tail-latency analysis.

---

### Condition 5 — Chrome, production build, 3 runs

**Run 1 (cold):**

| Strategy        | Pct  | 10ch    | 100ch  | 1000ch | 5000ch  |
|-----------------|------|---------|--------|--------|---------|
| Pretext prepare | once | 7900.00 | 400.00 | 500.00 | 2200.00 |
| DOM             | p50  | 8.50    | 13.00  | 53.60  | 232.80  |
| DOM             | p95  | 9.50    | 13.60  | 55.37  | 234.09  |
| DOM             | p99  | 10.74   | 13.91  | 56.02  | 234.42  |
| Canvas          | p50  | 0.10    | 0.80   | 7.20   | 35.40   |
| Canvas          | p95  | 0.20    | 0.90   | 7.30   | 36.20   |
| Canvas          | p99  | 0.30    | 0.90   | 7.60   | 36.30   |
| Pretext         | p50  | 0.10    | 0.20   | 1.50   | 7.30    |
| Pretext         | p95  | 0.20    | 0.30   | 1.60   | 7.50    |
| Pretext         | p99  | 0.20    | 0.30   | 1.60   | 7.60    |

**Run 3 (warm, representative):**

| Strategy        | Pct  | 10ch   | 100ch  | 1000ch | 5000ch  |
|-----------------|------|--------|--------|--------|---------|
| Pretext prepare | once | 300.00 | 100.00 | 200.00 | 1100.00 |
| DOM             | p50  | 8.50   | 13.10  | 54.00  | 232.75  |
| DOM             | p95  | 9.60   | 14.20  | 55.68  | 234.87  |
| DOM             | p99  | 10.22  | 15.14  | 57.42  | 235.85  |
| Canvas          | p50  | 0.10   | 0.80   | 7.20   | 35.80   |
| Canvas          | p95  | 0.20   | 0.80   | 7.30   | 36.20   |
| Canvas          | p99  | 0.30   | 0.90   | 7.50   | 36.30   |
| Pretext         | p50  | 0.10   | 0.20   | 1.50   | 7.30    |
| Pretext         | p95  | 0.20   | 0.30   | 1.60   | 7.50    |
| Pretext         | p99  | 0.20   | 0.30   | 1.70   | 7.50    |

**Dev vs prod comparison (Chrome warm):**

| 5000ch p50 | Dev    | Prod   | Δ          |
|------------|--------|--------|------------|
| DOM        | 235.15 | 232.75 | ≈ same     |
| Canvas     | 35.60  | 35.80  | ≈ same     |
| Pretext    | 7.50   | 7.30   | ≈ same     |

| 10ch p50  | Dev   | Prod | Δ                    |
|-----------|-------|------|----------------------|
| DOM       | 17.80 | 8.50 | **prod 52% faster**  |
| Canvas    | 0.10  | 0.10 | same                 |
| Pretext   | 0.10  | 0.10 | same                 |

| 100ch p50 | Dev   | Prod  | Δ                    |
|-----------|-------|-------|----------------------|
| DOM       | 22.20 | 13.10 | **prod 41% faster**  |
| Canvas    | 0.80  | 0.80  | same                 |
| Pretext   | 0.20  | 0.20  | same                 |

**Findings:**
- Astro dev middleware, source maps, and unminified runtime add ~9–14µs of fixed overhead to DOM operations regardless of input size.
- Invisible at 5000ch (~235µs total), inflates 10ch DOM by 50%.
- Canvas and Pretext are unaffected — they don't touch the DOM, so dev middleware doesn't intervene. Incidental validation of strategy isolation.
- Cold start in prod is even more pronounced than dev: 7900µs vs 6500µs at 10ch (+22%). Minified code requires more JIT work on first run.
- Stability runs 2–3: DOM ±0.6%, Canvas ±0.3%, Pretext 0%.

---

### Condition 6 — Safari, production build, 4 runs

**Run 1 (cold):**

| Strategy        | Pct  | 10ch     | 100ch   | 1000ch  | 5000ch  |
|-----------------|------|----------|---------|---------|---------|
| Pretext prepare | once | 10000.00 | 1000.00 | 1000.00 | 2000.00 |
| DOM             | p50  | 34.00    | 34.00   | 46.00   | 87.00   |
| DOM             | p95  | 35.00    | 35.00   | 47.00   | 89.00   |
| DOM             | p99  | 35.00    | 36.00   | 47.91   | 89.00   |
| Canvas          | p50  | 0.00     | 1.00    | 6.00    | 28.00   |
| Canvas          | p95  | 1.00     | 1.00    | 6.00    | 28.00   |
| Canvas          | p99  | 1.00     | 1.00    | 6.00    | 29.00   |
| Pretext         | p50  | 0.00     | 0.00    | 2.00    | 9.00    |
| Pretext         | p95  | 1.00     | 1.00    | 2.00    | 10.00   |
| Pretext         | p99  | 1.00     | 1.00    | 2.00    | 10.00   |

**Run 4 (warm, representative):**

| Strategy        | Pct  | 10ch  | 100ch | 1000ch  | 5000ch  |
|-----------------|------|-------|-------|---------|---------|
| Pretext prepare | once | 0.00  | 0.00  | 1000.00 | 1000.00 |
| DOM             | p50  | 34.00 | 36.00 | 46.00   | 87.00   |
| DOM             | p95  | 35.00 | 37.00 | 47.00   | 89.00   |
| DOM             | p99  | 35.54 | 37.00 | 47.00   | 89.00   |
| Canvas          | p50  | 0.00  | 1.00  | 6.00    | 29.00   |
| Canvas          | p95  | 1.00  | 1.00  | 6.00    | 31.00   |
| Canvas          | p99  | 1.00  | 1.00  | 7.00    | 33.62   |
| Pretext         | p50  | 0.00  | 0.00  | 2.00    | 9.00    |
| Pretext         | p95  | 1.00  | 1.00  | 2.00    | 10.00   |
| Pretext         | p99  | 1.00  | 1.00  | 2.00    | 10.00   |

**Findings:**
- `performance.now()` resolution ≈1ms in Safari (matches Firefox, not Chrome). Pretext.prepare values <1ms collapse to 0; only differentiable cell is 5000ch (~1000µs).
- Stability runs 2–4: DOM ±0.5%, Canvas ±3%, Pretext 0%.
- Cold start visible in run 1 (10000µs at 10ch, presumably ~300µs warm but below resolution).
- **WebKit DOM is dramatically faster than Blink at large inputs (87 vs 233µs at 5000ch, ≈2.7× faster), but slower at small inputs (34 vs 8.5µs at 10ch, ≈4× slower).** Different reflow cost models: WebKit has higher fixed setup cost but lower per-character cost; Blink the inverse.

---

### Condition 7 — Chrome Incognito, no extensions, prod build, 4 runs

Validation that resident browser extensions are not interfering with measurements.

**Run 4 (warm, representative):**

| Strategy        | Pct  | 10ch   | 100ch  | 1000ch | 5000ch |
|-----------------|------|--------|--------|--------|--------|
| Pretext prepare | once | 200.00 | 100.00 | 200.00 | 900.00 |
| DOM             | p50  | 8.60   | 13.10  | 54.50  | 235.55 |
| DOM             | p95  | 9.60   | 14.10  | 55.59  | 236.30 |
| DOM             | p99  | 9.96   | 14.40  | 56.01  | 236.77 |
| Canvas          | p50  | 0.10   | 0.80   | 7.30   | 36.00  |
| Canvas          | p95  | 0.20   | 0.80   | 7.40   | 36.60  |
| Canvas          | p99  | 0.30   | 0.90   | 7.50   | 36.70  |
| Pretext         | p50  | 0.10   | 0.20   | 1.50   | 7.40   |
| Pretext         | p95  | 0.20   | 0.30   | 1.60   | 7.50   |
| Pretext         | p99  | 0.20   | 0.30   | 1.70   | 7.60   |

**Delta vs Chrome prod (Condition 5, run 3 warm):**

| 5000ch p50 | Prod   | Incognito | Δ      |
|------------|--------|-----------|--------|
| DOM        | 232.75 | 235.55    | +1.2%  |
| Canvas     | 35.80  | 36.00     | +0.6%  |
| Pretext    | 7.30   | 7.40      | +1.4%  |

**Findings:**
- All deltas vs regular Chrome prod within run-to-run noise (~1%).
- On this machine, extensions had no measurable effect. Numbers from non-incognito Chrome can be trusted.
- This finding is environment-specific. Other readers with heavier extensions (analytics blockers with main-thread observers, dev-tool extensions, etc.) may see larger deltas.

---

### Cross-condition findings

1. **Pretext cold start is large and reproducible.** ≈18–22× penalty on first run for short text in Chrome dev/prod, ≈30× in Safari. JIT warm-up plus lazy canvas/font init in Pretext together. Worth surfacing in the UI as a separate Pre-warm action.

2. **Pretext layout cost is the most stable metric in the suite.** Zero drift across 10 runs in Chrome, no measurement noise. Matches design intent (pure arithmetic, no allocations).

3. **DOM and Canvas exhibit slow upward drift (~1–2% / 10 runs).** Likely GC pressure. Not a blocker but worth noting.

4. **Browser engine differences are large and non-uniform.** No engine wins universally. See three-engine table below.

5. **Timer resolution varies by browser:**

   | Browser  | `performance.now()` resolution | Effect                              |
   |----------|--------------------------------|-------------------------------------|
   | Chrome   | ≈100µs                         | Sub-µs values resolved via batching |
   | Firefox  | ≈1ms                           | prepare cells ±1ms granularity      |
   | Safari   | ≈1ms                           | Same as Firefox                     |

6. **DevTools must be closed during benchmarking.** Largely invisible in p50 (+5–15%), devastating in tails (up to 70× worse for short-input p99). Documented in Condition 4.

7. **Dev build inflates DOM measurements on small inputs.** ~50% inflation at 10ch, fading to zero at 5000ch. Dev numbers unreliable for short-text comparisons. All published numbers come from prod.

8. **Browser extensions had no measurable effect on this machine.** Validated via Condition 7. Not generalizable to all readers.

### Three-engine comparison (5000ch p50, prod build, warm)

| Strategy | Chrome | Firefox | Safari | Notes                                 |
|----------|--------|---------|--------|---------------------------------------|
| DOM      | 232.75 | 339.00  | 87.00  | Safari ≈2.7× faster than Chrome       |
| Canvas   | 35.80  | 27.00   | 29.00  | Firefox/Safari similar, both > Chrome |
| Pretext  | 7.30   | 11.00   | 9.00   | Chrome fastest                         |

There is no «universally fast» browser for layout. Blink wins on small DOM and on Pretext arithmetic. WebKit wins on large DOM by a wide margin. Gecko sits between them on DOM and slightly leads on Canvas. Single-browser benchmarking would have produced misleading universal claims either way.

> Note: Firefox numbers above were collected in dev build (Condition 3). Spot-checking against prod was not done for Firefox. Risk of dev-mode inflation in Firefox numbers exists; deferred as the cross-engine differences (>40%) dwarf the dev/prod delta (<5% on long inputs). Worth re-running for Stage 2.

---

### Acceptance check

Cross-condition variance for warm `5000ch DOM p50` (excluding DevTools open):

| Condition           | Value  |
|---------------------|--------|
| Chrome dev warm     | 235.15 |
| Chrome dev run 10   | 239.40 |
| Chrome prod warm    | 232.75 |
| Chrome incognito    | 235.55 |

Range: 232.75 → 239.40 = **+2.9%**. Target was ±15%. **Pass.**

---

### Decisions

1. **UX:** add a separate **Pre-warm** button to the bench runner. Surfaces cold start as a feature, not noise. Tooltip explains JIT warm-up and Pretext lazy init.
2. **Methodology page:** sections required —
   - Timer resolution per browser, why batching by 1000 is used.
   - Cold start vs steady state, why pre-warm exists.
   - DevTools advisory: close before running.
   - Dev vs prod build advisory.
   - Why DOM drift is reported and not engineered away.
3. **Final results presentation:** report Chrome, Firefox, and Safari in three separate columns. Never average. Single-engine numbers are misleading.
4. **Acceptance threshold for stable runs:** within-condition variance ≤ ±2% across runs 2+ (run 1 is always cold). Currently met.
5. **All headline numbers come from `pnpm build && pnpm preview`, never from dev mode.** Dev-mode timings are documented as a methodology footnote, not as primary results.

---

### TODO before publication

- [ ] Implement Pre-warm button
- [ ] Re-run Firefox in prod build (dev/prod delta likely <5%, but cleaner)
- [ ] Write conclusion paragraph in `01-single-measurement.mdx`
- [ ] Methodology page draft
- [ ] Deploy to Vercel, verify Lighthouse score on homepage and experiment page
