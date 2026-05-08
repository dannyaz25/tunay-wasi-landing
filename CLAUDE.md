# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

Open `index.html` directly in a browser — no build step required. The app uses React 18 + Babel standalone loaded from unpkg CDN, with JSX transpiled in-browser.

```bash
# Quick local server (pick any):
npx serve .
python3 -m http.server 8080
open index.html   # works on macOS for read-only testing
```

> `file://`  protocol may block cross-origin script loads on some browsers. Use a local HTTP server.

## Architecture

The project is a **single-page React landing** for Tunay Wasi (Peruvian specialty coffee). No bundler, no TypeScript — all JSX components load via `<script type="text/babel">` tags in `index.html`.

**Load order matters** (defined in `index.html`):
1. Plain JS libs first (`lib/money.js`, `lib/cartSchema.js`, `lib/checkout.js`) — they set globals on `window`
2. Babel-transpiled files in dependency order: `Hummingbird` → `Decor` → `cartStore` → `useCartTotals` → all page components → `CartDrawer` → `CartButton` → `Checkout`
3. Inline `<script type="text/babel">` at the bottom mounts `<App />`

**State management** (`lib/cartStore.js`): Zustand-shaped micro-store with `setState/getState/subscribe` and localStorage persist middleware (key: `tw_cart_v1`). Components read state via `window.useCart(selector)`. All cart mutations go through `window.cartStore.getState().add/inc/dec/remove/clear`.

**Money** (`lib/money.js`): All prices stored as integer cents internally. Use `Money.toCents`, `Money.fromCents`, `Money.formatPEN` — never do float arithmetic on prices.

**Validation** (`lib/cartSchema.js`): Zod-like `CartItemSchema` validates items before they enter the store. Required fields: `id`, `sku`, `name`, `weight` (enum: 250g/1kg/3kg), `grind` (enum), `unitCents` (int), `qty`, `maxQty`, `caficultor`, `finca`.

**Checkout** (`lib/checkout.js`): Adapter pattern for `niubiz`, `stripe`, `yapePlin`. Wire real payment by replacing the `async (payload) => { ... }` body of the relevant adapter.

## Design system

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#f2e0cc` | Page background |
| Deep green | `#1f3028` | Text, dark sections |
| Terracotta | `#c96e4b` | CTAs, accents |
| Sage | `#8faf8a` | Secondary details |
| Tan | `#c4b297` | Muted text |
| Dark brown | `#533b22` | Shadows, captions |

Fonts (loaded from Google Fonts): Cormorant Garamond (headings), Montserrat (body), Mulish (logo), Bowlby One SC (Bauhaus labels), JetBrains Mono (metadata).

## Page sections (in order)

`Nav` → `Hero` → `Preventa` → `Origen` → `Caficultores` → `Cafe` → `Modelo` → `Contacto` → `Footer`

Floating overlays: `CartButton` (bottom-right), `CartDrawer` (slide-in panel), `Checkout` (two-step modal: Datos → Pago).

## Key things to replace before launch

- **Images**: `ImageSlot` placeholders in `components/Decor.jsx` — swap with real `<img>` tags
- **Contact form**: `components/Contacto.jsx` — connect `POST /api/contact` serverless endpoint
- **Stock check**: `lib/checkout.js` `checkStock()` — replace with real `POST /api/stock/check`
- **Payment**: `lib/checkout.js` adapters — integrate Niubiz/Yape SDK
- **Hummingbird SVG**: `components/Hummingbird.jsx` — replace with official brand SVG if provided
- **Dates**: Hardcoded May 2026 delivery dates in `Preventa.jsx` and `CartDrawer.jsx`

## Brand assets

Brand guide pages are in `brand/` as PNG exports from the PDF (`page-1-img-0.png`, `page-2-img-1.png`, `page-3-img-2.png`).

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
