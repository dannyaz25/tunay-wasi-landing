# Tunay Wasi Landing

E-commerce landing page for Tunay Wasi, a Peruvian specialty coffee brand featuring pre-sale of micro-lot coffees directly from caficultores in Oxapampa.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build tool**: Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Validation**: Zod
- **Styling**: Plain CSS with design tokens
- **Database**: Firebase

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── cart/         # Cart button and drawer
│   ├── decor/        # Decorative elements (Hummingbird, dividers)
│   ├── layout/       # Nav and Footer
│   └── sections/     # Page sections (Hero, Origen, Modelo)
├── features/         # Feature-based modules
│   ├── catalog/      # Coffee catalog and caficultores
│   ├── cart/         # Cart logic and store
│   ├── checkout/     # Checkout flow and payment adapters
│   ├── contact/      # Contact form
│   └── preventa/     # Pre-sale countdown
├── shared/           # Shared utilities
│   ├── types/        # TypeScript interfaces
│   ├── firebase.ts   # Firebase config
│   └── money.ts      # Price handling (cents)
└── App.tsx           # Main app component
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```

Starts the Vite development server at `http://localhost:5173`.

### Build

```bash
yarn build
```

Builds for production. Output in `dist/`.

### Preview Production Build

```bash
yarn preview
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#f2e0cc` | Page background |
| Deep green | `#1f3028` | Text, dark sections |
| Terracotta | `#c96e4b` | CTAs, accents |
| Sage | `#8faf8a` | Secondary details |
| Tan | `#c4b297` | Muted text |
| Dark brown | `#533b22` | Shadows, captions |

**Fonts**: Cormorant Garamond (headings), Montserrat (body), Mulish (logo), Bowlby One SC (labels), JetBrains Mono (metadata).

## Important Patterns

### Money Handling

All prices use **integer cents**. Use utilities from `src/shared/money.ts`:

- `Money.toCents(amount)` - Convert float to cents
- `Money.fromCents(cents)` - Convert cents to float
- `Money.formatPEN(cents)` - Format as Peruvian Sol

### Cart State

Access cart via `window.cartStore`:

```typescript
window.cartStore.getState().add(item)
window.cartStore.getState().inc(sku)
window.cartStore.getState().dec(sku)
window.cartStore.getState().remove(sku)
window.cartStore.getState().clear()
```

Components subscribe with `window.useCart(selector)`.

## Pre-Launch Items

- [ ] Replace ImageSlot placeholders with real images in `src/components/decor/ImageSlot.tsx`
- [ ] Connect contact form to `POST /api/contact`
- [ ] Replace mock stock check in checkout with real API
- [ ] Integrate Niubiz/Yape payment adapters
- [ ] Add official Hummingbird SVG in `src/components/decor/Hummingbird.tsx`
- [ ] Update hardcoded May 2026 delivery dates

## License

MIT