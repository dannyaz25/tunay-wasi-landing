# AGENTS.md

## Running the project

```bash
npx serve .
# or
python3 -m http.server 8080
```

Do not open `index.html` directly via `file://` — scripts won't load due to CORS.

## Important patterns

- **Money**: All prices use integer cents. Use `Money.toCents()`, `Money.fromCents()`, `Money.formatPEN()` — never use floating-point arithmetic.
- **Cart state**: Access via `window.cartStore.getState().add/inc/dec/remove/clear`. Components subscribe with `window.useCart(selector)`.
- **Script load order**: Defined in `index.html`. Plain JS libs (`money.js`, `cartSchema.js`, `checkout.js`) must load before Babel components.

## Pre-launch items (from CLAUDE.md)

- Images in `components/Decor.jsx` (ImageSlot placeholders)
- Contact form in `components/Contacto.jsx` → connect `POST /api/contact`
- Stock check in `lib/checkout.js` → replace mock with real API
- Payment adapters in `lib/checkout.js` → integrate Niubiz/Yape
- Hummingbird SVG in `components/Hummingbird.jsx`
- Dates in `Preventa.jsx` and `CartDrawer.jsx` (hardcoded May 2026)

## Notes

- No lint/typecheck/test — this is plain HTML + React via CDN, no build system
- Brand assets: `brand/` contains PNG exports from the PDF brand guide

## Working guidelines

### Git
- All commit messages must be in **English**.
- Subject line max **100 characters**; use the `type: short description` format (feat, fix, refactor, chore…).

### Branding compliance
- Every new component, redesign, or visual change **must follow the design system** above (colors, fonts, spacing tokens). Do not introduce colors, typefaces, or patterns outside the defined tokens.
- Before creating a new component, check whether an equivalent already exists in `src/components/` or `src/features/`.

### Ambiguity & conflict resolution
- If a prompt is ambiguous or conflicts with existing design/architecture decisions, **ask before implementing** — do not guess.
- If two valid approaches exist, present the options with trade-offs and wait for a decision before writing code.
- When in doubt about branding (copy, color, imagery), pause and ask rather than ship something inconsistent.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
