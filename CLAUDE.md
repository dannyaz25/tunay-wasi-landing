# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

```bash
npm install
npm run dev          # http://localhost:5173

# Build for a specific target:
npm run build                              # B2C clientes (default)
VITE_APP_TARGET=caficultores npm run build # B2B caficultores landing
```

## Architecture

**Stack**: React 18 + TypeScript + Vite. No Babel standalone. No CDN scripts. Fully typed.

**Multi-app build** (`src/main.tsx`): `VITE_APP_TARGET` env var at build time selects which root component to render. Vite/Rollup tree-shakes the unused app entirely.

| `VITE_APP_TARGET` | App rendered | Entry |
|---|---|---|
| unset / `clientes` | B2C consumer landing | `src/App.tsx` |
| `caficultores` | B2B producer waitlist | `src/AppCaficultores.tsx` |

**Feature modules** (`src/features/`): each feature owns its components, hooks, and service calls. Cross-feature sharing goes in `src/shared/` or `src/components/`.

```
src/
├── components/          # Shared UI (Hummingbird, Nav, Footer, Cart*, decor)
├── features/
│   ├── caficultores/    # B2B producer landing (CafiNav, CafiHero, CafiCalculator…)
│   ├── catalog/         # Coffee catalog, product cards, caficultor profiles
│   ├── cart/            # Cart store (Zustand), schema, totals, shipping
│   ├── checkout/        # Checkout modal, adapters (niubiz / stripe / yapePlin)
│   ├── contact/         # Contact form (EmailJS + WhatsApp fallback)
│   └── preventa/        # Pre-sale countdown
├── shared/
│   ├── firebase.ts      # Firebase config
│   ├── money.ts         # Integer-cents helpers
│   ├── queryClient.ts   # TanStack React Query client
│   ├── types/           # cart.ts, catalog.ts, checkout.ts, firestore.ts
│   └── validation/
├── App.tsx              # B2C root
├── AppCaficultores.tsx  # B2B root
└── main.tsx             # Bootstraps correct app from VITE_APP_TARGET
```

## Design system

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#f2e0cc` | B2C page background |
| Deep green | `#1f3028` | B2B background, B2C text/dark sections |
| Terracotta | `#c96e4b` | CTAs, accents |
| Sage | `#8faf8a` | Secondary details |
| Tan | `#c4b297` | Muted text |
| Dark brown | `#533b22` | Shadows, captions |

Fonts (Google Fonts, loaded in `index.html`): Cormorant Garamond (headings), Montserrat (body), Mulish (logo), Bowlby One SC (Bauhaus labels), JetBrains Mono (metadata).

**B2C** uses cream (`#f2e0cc`) as page background. **B2B caficultores** uses deep green (`#1f3028`) — dark theme throughout.

## Page sections

**B2C** (`App.tsx`): `Nav` → `Hero` → `Preventa` → `Origen` → `Caficultores` → `Cafe` → `Modelo` → `Contacto` → `Footer`
Floating overlays: `CartButton`, `CartDrawer`, `Checkout`

**B2B caficultores** (`AppCaficultores.tsx`): `CafiNav` → `CafiHero` → `CafiCalculator` → `CafiBeneficios` → `CafiLista` → `CafiFAQ` → `CafiFinalCTA` → `CafiFooter`

## Key patterns

**Money** (`src/shared/money.ts`): All prices stored as integer cents. Use `Money.toCents`, `Money.fromCents`, `Money.formatPEN` — never float arithmetic.

**Cart state** (Zustand, `src/features/cart/cartStore.ts`): mutations via `cartStore.getState().add/inc/dec/remove/clear`. Components subscribe with the `useCart` hook.

**Checkout adapters** (`src/features/checkout/adapters/`): `niubizAdapter`, `stripeAdapter`, `yapePlinAdapter`. Wire real payment by implementing the adapter body.

**Catalog** (`src/features/catalog/`): data from Firestore via TanStack Query hooks (`useCatalog`, `useCaficultores`, `useActiveCycle`, etc.).

**SCA pricing matrix**: lives in Firestore `configuration/pricing`. The B2B calculator in `CafiCalculator.tsx` uses hardcoded tiers until wired to Firestore.

## Pre-launch checklist

### B2C
- [ ] Replace `ImageSlot` placeholders in `src/components/decor/ImageSlot.tsx` with real images
- [ ] Replace official Hummingbird SVG in `src/components/decor/Hummingbird.tsx`
- [ ] Wire stock check in checkout to real `POST /api/stock/check`
- [ ] Update hardcoded May 2026 delivery dates in `Preventa.tsx` and `CartDrawer.tsx`

### B2B caficultores
- [ ] Wire `CafiLista` form (`src/features/caficultores/components/CafiLista.tsx`) to `POST /api/caficultores/waitlist`
- [ ] Pull SCA tiers from Firestore `configuration/pricing` into `CafiCalculator.tsx` (currently hardcoded)
- [ ] Connect caficultores subdomain deployment with `VITE_APP_TARGET=caficultores`

## Brand assets

Brand guide in `brand/` as PNG exports from PDF (`page-1-img-0.png`, `page-2-img-1.png`, `page-3-img-2.png`).

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
|------|----------|
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
