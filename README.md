# Pretext Lab

Browser-based benchmarking lab for **Pretext.js**: **DOM** vs **Canvas** vs **Pretext** across virtual lists, streaming chat, multilingual text, and CPU-throttled devices.

## Scenarios

- **Virtual lists** — scroll performance and memory when rendering large, windowed row sets.
- **Streaming chat** — incremental append throughput and layout stability as messages arrive.
- **Multilingual text** — shaping, line breaking, and mixed-script rendering under load.
- **CPU-throttled devices** — behavior when the main thread is constrained (DevTools CPU throttling or low-power hardware profiles).

## Comparisons

Each scenario exercises the same workloads with three rendering strategies so results are comparable:

1. **DOM** — conventional HTML/CSS text and layout.
2. **Canvas** — text drawn via a 2D canvas (or similar immediate-mode path).
3. **Pretext** — Pretext.js rendering for the same content and interaction patterns.
