# AGENTS.md

AI agent instructions for this repository. Read before writing any code.

## Running the project

```bash
npm install
npm run dev        # dev server → http://localhost:5173
npx tsc --noEmit   # type check (no test suite)
npm run build      # production build (B2C default)
VITE_APP_TARGET=caficultores npm run build  # B2B caficultores build
```

No `file://` protocol. No Babel standalone. No CDN scripts. This is a standard Vite + React + TypeScript project.

## Multi-app architecture

`src/main.tsx` reads `import.meta.env.VITE_APP_TARGET` at build time and dynamically imports the correct root component. Rollup tree-shakes the unused app.

| Target | Root | Purpose |
|--------|------|---------|
| unset / `clientes` | `src/App.tsx` | B2C consumer e-commerce landing |
| `caficultores` | `src/AppCaficultores.tsx` | B2B producer waitlist / acquisition |

**When adding to B2C**: work inside `src/App.tsx` and its imports.  
**When adding to B2B**: work inside `src/features/caficultores/` and `src/AppCaficultores.tsx`.  
**Shared code** (design tokens, Hummingbird, money utils): `src/components/` and `src/shared/`.

## File structure

```
src/
├── components/
│   ├── cart/          CartButton.tsx, CartDrawer.tsx
│   ├── decor/         Hummingbird.tsx, GrainOverlay.tsx, ImageSlot.tsx, ...
│   └── layout/        Nav.tsx, Footer.tsx
├── features/
│   ├── caficultores/  B2B landing (CafiNav, CafiHero, CafiCalculator,
│   │   └── components/ CafiBeneficios, CafiLista, CafiFAQ, CafiFinalCTA)
│   ├── catalog/       useCatalog, useCaficultores, Cafe.tsx, Caficultores.tsx...
│   ├── cart/          cartStore.ts (Zustand), cartSchema.ts, useCart.ts, shippingRules.ts
│   ├── checkout/      Checkout.tsx, adapters/, orderService.ts, checkoutService.ts
│   ├── contact/       Contacto.tsx
│   └── preventa/      Preventa.tsx, useCountdown.ts
├── shared/
│   ├── firebase.ts    Firebase config (reads VITE_FIREBASE_* env vars)
│   ├── money.ts       Integer-cents helpers
│   ├── queryClient.ts TanStack React Query singleton
│   ├── constants.ts
│   └── types/         cart.ts, catalog.ts, checkout.ts, firestore.ts
├── App.tsx            B2C root
├── AppCaficultores.tsx B2B root
├── main.tsx           Bootstraps correct app via VITE_APP_TARGET
└── vite-env.d.ts      Types VITE_APP_TARGET, VITE_FIREBASE_*, VITE_EMAILJS_*
```

## Critical patterns

### Money
All prices stored as **integer cents**. Use `src/shared/money.ts`:
```ts
Money.toCents(19.90)      // → 1990
Money.fromCents(1990)     // → 19.90
Money.formatPEN(1990)     // → "S/ 19.90"
```
Never do float arithmetic on prices.

### Cart state (Zustand)
```ts
import { cartStore } from '@/features/cart/cartStore';
cartStore.getState().add(item)   // CartItemSchema-validated
cartStore.getState().inc(sku)
cartStore.getState().dec(sku)
cartStore.getState().remove(sku)
cartStore.getState().clear()
```
Components subscribe via `useCart` hook (`src/features/cart/useCart.ts`).

### Checkout adapters
`src/features/checkout/adapters/` — one file per gateway: `niubizAdapter.ts`, `stripeAdapter.ts`, `yapePlinAdapter.ts`. Each exports `async execute(payload)`. Replace body with real SDK call to go live.

### Catalog data
Firestore data fetched via TanStack Query hooks in `src/features/catalog/`:
- `useCatalog()` — products
- `useCaficultores()` — producer profiles
- `useActiveCycle()` — pre-sale cycle (countdown, delivery dates)
- `useLandingConfig()` — hero metrics, grind options, WhatsApp number

### SCA pricing
B2B calculator (`CafiCalculator.tsx`) uses hardcoded tiers. Live tiers live in Firestore `configuration/pricing` — wire via a new hook when ready.

### Path alias
`@/` resolves to `src/`. Use it for all internal imports.

## Design system

| Token | Hex | Notes |
|-------|-----|-------|
| Cream | `#f2e0cc` | B2C background |
| Deep green | `#1f3028` | B2B background; B2C dark sections |
| Terracotta | `#c96e4b` | CTAs, primary accents |
| Sage | `#8faf8a` | Secondary, success states |
| Tan | `#c4b297` | Muted text |
| Dark brown | `#533b22` | Shadows, captions |

Fonts: Cormorant Garamond, Montserrat, Mulish, Bowlby One SC, JetBrains Mono — all loaded via Google Fonts in `index.html`.

## Pre-launch items

### B2C
- [ ] `src/components/decor/ImageSlot.tsx` — swap placeholders with real images
- [ ] `src/components/decor/Hummingbird.tsx` — replace with official brand SVG
- [ ] Checkout stock check → real `POST /api/stock/check`
- [ ] Hardcoded May 2026 delivery dates in `Preventa.tsx` + `CartDrawer.tsx`

### B2B caficultores
- [ ] `CafiLista.tsx` submit handler → wire to `POST /api/caficultores/waitlist`
- [ ] `CafiCalculator.tsx` SCA tiers → pull from Firestore `configuration/pricing`
- [ ] Set `VITE_APP_TARGET=caficultores` on caficultores subdomain hosting

## Working guidelines

### Git
- All commit messages in **English**.
- Max 100 chars subject; format: `type: short description`.

### Branding compliance
- All visual changes must use design tokens above — no new colors, fonts, or spacing.
- Check `src/components/` and `src/features/` before creating new components.

### Ambiguity
- Ask before implementing when requirements are unclear or conflict with existing patterns.
- Two valid approaches → present trade-offs, wait for decision.

## MCP Tools: code-review-graph

**Use graph tools BEFORE Grep/Glob/Read.**

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes |
| `get_impact_radius` | Blast radius of a change |
| `get_affected_flows` | Which execution paths are impacted |
| `query_graph` | Callers, callees, imports, tests |
| `semantic_search_nodes` | Find by name or keyword |
| `get_architecture_overview` | High-level structure |
| `refactor_tool` | Renames, dead code |

Graph auto-updates on file changes via hooks.
