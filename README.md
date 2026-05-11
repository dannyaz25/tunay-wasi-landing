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
- [x] Connect contact form to EmailJS (with WhatsApp fallback on failure)
- [ ] Replace mock stock check in checkout with real API
- [x] Integrate Yape/Plin payment support (see `src/features/catalog/useYapePlin.ts`)
- [x] Add shipping calculation and rules (see `src/features/cart/shippingRules.ts`, `src/features/catalog/useShipping.ts`)
- [x] Add landing configuration (see `src/features/catalog/useLandingConfig.ts`)
- [x] Add comisiones calculation (see `src/features/catalog/useComisiones.ts`)
- [ ] Add official Hummingbird SVG in `src/components/decor/Hummingbird.tsx`
- [ ] Update hardcoded May 2026 delivery dates

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# EmailJS
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

Get your EmailJS credentials from [dashboard.emailjs.com](https://dashboard.emailjs.com/admin/templates). The contact form uses two dynamic template variables: `to_email`, `subject`, and `html_content`. On failure, it redirects to WhatsApp using the number defined in Firestore `landing.contact.whatsapp`.

## Firebase Firestore Schema

### Collections

| Collection | Path | Description |
|------------|------|-------------|
| `caficultores` | `/caficultores/{id}` | Coffee producers (onboarding → admin approval → display) |
| `productos` | `/productos/{id}` | Coffee products linked to caficultores |
| `pedidos` | `/pedidos/{id}` | Orders created on payment completion |

### Configuration Docs

| Doc | Path | Purpose |
|-----|------|---------|
| `ciclo_activo` | `/configuration/ciclo_activo` | Pre-sale cycle control (countdown, delivery dates) |
| `comisiones` | `/configuration/comisiones` | Price breakdown (caficultor, toaster, logistics, IGV, platform) |
| `pricing` | `/configuration/pricing` | SCA-tier price matrix and production costs |
| `shipping` | `/configuration/shipping` | Shipping zones and rates per region |
| `landing` | `/configuration/landing` | Grind options, contact info, hero metrics |
| `yapePlin` | `/configuration/yapePlin` | Yape/Plin QR payment configuration |
| `paymentGateway` | `/configuration/paymentGateway` | Niubiz and Stripe gateway settings |

### Data Flow

```
CaficultorDoc ←── ProductoDoc ←── PedidoItem
     └────────────────────────────────────── PedidoDoc
```

- `ProductoDoc.caficultorId` → `CaficultorDoc.id`
- `PedidoItem.productoId` → `ProductoDoc.id`
- `PedidoItem.caficultorId` → `CaficultorDoc.id`

### Integrations

| Integration | Type | Description |
|-------------|------|-------------|
| **EmailJS** | Transactional Email | Contact form sends confirmation to client + notification to admin |
| **Yape/Plin** | QR Payment | Manual transfer with voucher upload, admin confirmation |
| **Niubiz** | Payment Gateway | Card payments via Peruvian payment processor |
| **Stripe** | Payment Gateway | International card payments |
| **Firebase Storage** | File Storage | Producer photos, payment vouchers |

### Firebase Storage Paths

- `tunaywasi/caficultores/{id}/` — Producer profile and farm photos
- `pedidos/vouchers/{id}.jpg` — Yape/Plin payment vouchers

---

## License

MIT