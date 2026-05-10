# CLAUDE.md

Guidance for Claude / LLM agents working in this repository.

## LLM Wiki (`.wiki/`)

This project keeps a compiled wiki layer:

- `.wiki/STATE.md` — live snapshot: in progress, recently done, on the horizon, open questions
- `.wiki/DECISIONS.md` — ADR-style log of decisions with rationale
- `.wiki/ARCHITECTURE.md` — current technical reality (stack, structure, cross-cutting patterns)

### Update rules

- **STATE.md** — refresh at the end of a significant session, or after a Linear issue opens/closes. Update the `Last updated` date.
- **DECISIONS.md** — add an entry whenever a decision overturns, replaces, or pins a choice. Format: `## YYYY-MM — Short title`. Newest on top.
- **ARCHITECTURE.md** — update when the stack changes, the structure changes, or a new cross-cutting pattern appears. Update the `Last updated` date.

### Don't duplicate

- Linear issue contents — STATE.md links issue IDs, it doesn't restate them
- Commit messages
- README.md — that's for external readers
