# Tunay Wasi — Landing

E-commerce and producer acquisition landing for **Tunay Wasi**, a Peruvian specialty coffee brand. Direct trade micro-lot pre-sales from caficultores to consumers, with transparent SCA-based pricing.

## Tech Stack

| | |
|--|--|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| State | Zustand |
| Data fetching | TanStack React Query |
| Validation | Zod |
| Styling | Plain CSS (no Tailwind) — inline styles + design tokens |
| Database | Firebase Firestore |
| Email | EmailJS |

## Two Apps, One Repository

This repo builds two separate single-page apps from the same codebase, selected at build time via `VITE_APP_TARGET`:

| App | Target | URL |
|-----|--------|-----|
| **B2C** — consumer landing + cart + checkout | `clientes` (default) | tunaywasi.pe |
| **B2B** — caficultores producer waitlist | `caficultores` | caficultores.tunaywasi.pe |

Rollup tree-shakes the unused app at build time — consumers never download producer code and vice versa.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
# B2C consumer landing (default)
npm run dev

# B2B caficultores landing
VITE_APP_TARGET=caficultores npm run dev
```

Dev server: `http://localhost:5173`

### Build

```bash
# B2C (default)
npm run build

# B2B caficultores
VITE_APP_TARGET=caficultores npm run build
```

### Type check

```bash
npx tsc --noEmit
```

## Project Structure

```
src/
├── components/              # Shared UI
│   ├── cart/                #   CartButton, CartDrawer
│   ├── decor/               #   Hummingbird, GrainOverlay, ImageSlot, ...
│   └── layout/              #   Nav, Footer
├── features/
│   ├── caficultores/        # B2B producer landing
│   │   └── components/      #   CafiNav, CafiHero, CafiCalculator,
│   │                        #   CafiBeneficios, CafiLista, CafiFAQ,
│   │                        #   CafiFinalCTA, CafiFooter
│   ├── catalog/             # Product catalog + caficultor profiles
│   ├── cart/                # Cart store (Zustand), schema, totals, shipping
│   ├── checkout/            # Checkout modal + payment adapters
│   ├── contact/             # Contact form (EmailJS + WhatsApp fallback)
│   └── preventa/            # Pre-sale countdown
├── shared/
│   ├── firebase.ts          # Firebase config
│   ├── money.ts             # Integer-cents price helpers
│   ├── queryClient.ts       # React Query singleton
│   └── types/               # TypeScript interfaces
├── App.tsx                  # B2C root component
├── AppCaficultores.tsx      # B2B root component
└── main.tsx                 # Bootstraps correct app from VITE_APP_TARGET
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#f2e0cc` | B2C page background |
| Deep green | `#1f3028` | B2B background, B2C dark sections |
| Terracotta | `#c96e4b` | CTAs, primary accents |
| Sage | `#8faf8a` | Secondary, success states |
| Tan | `#c4b297` | Muted text |
| Dark brown | `#533b22` | Shadows, captions |

**Fonts**: Cormorant Garamond (headings), Montserrat (body), Mulish (logo), Bowlby One SC (labels), JetBrains Mono (metadata). All loaded from Google Fonts in `index.html`.

## Environment Variables

Create `.env.local` in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# EmailJS (contact form)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=

# App target (optional — set on hosting platform, not in .env.local)
# VITE_APP_TARGET=caficultores
```

EmailJS template variables required: `to_email`, `subject`, `html_content`. On failure the contact form redirects to WhatsApp using the number stored in Firestore `configuration/landing.contact.whatsapp`.

## Firestore Schema

### Collections

| Collection | Path | Description |
|------------|------|-------------|
| `caficultores` | `/caficultores/{id}` | Coffee producers |
| `productos` | `/productos/{id}` | Coffee products (linked to caficultores) |
| `pedidos` | `/pedidos/{id}` | Orders created on checkout |

### Configuration Documents

| Doc | Path | Purpose |
|-----|------|---------|
| `ciclo_activo` | `/configuration/ciclo_activo` | Pre-sale cycle (countdown, delivery dates) |
| `comisiones` | `/configuration/comisiones` | Price breakdown (caficultor, roaster, logistics, IGV, platform) |
| `pricing` | `/configuration/pricing` | SCA-tier price matrix and production costs |
| `shipping` | `/configuration/shipping` | Shipping zones and rates |
| `landing` | `/configuration/landing` | Hero metrics, grind options, contact info |
| `yapePlin` | `/configuration/yapePlin` | Yape/Plin QR config |
| `paymentGateway` | `/configuration/paymentGateway` | Niubiz and Stripe settings |

### Data Relationships

```
CaficultorDoc ←── ProductoDoc ←── PedidoItem ──→ PedidoDoc
```

## Integrations

| Service | Purpose |
|---------|---------|
| Firebase Firestore | Catalog, orders, configuration |
| Firebase Storage | Producer photos, Yape/Plin vouchers |
| EmailJS | Contact form → admin email notification |
| Yape / Plin | QR manual transfer with voucher upload |
| Niubiz | Peruvian card payments |
| Stripe | International card payments |

### Firebase Storage Paths

- `tunaywasi/caficultores/{id}/` — producer profile and farm photos
- `pedidos/vouchers/{id}.jpg` — Yape/Plin payment vouchers

## Pre-Launch Checklist

### B2C consumer
- [ ] Replace `ImageSlot` placeholders with real images (`src/components/decor/ImageSlot.tsx`)
- [ ] Add official Hummingbird SVG (`src/components/decor/Hummingbird.tsx`)
- [x] Contact form → EmailJS (with WhatsApp fallback)
- [ ] Wire checkout stock check to real `POST /api/stock/check`
- [x] Yape/Plin payment support
- [x] Shipping calculation
- [x] Landing configuration (hero metrics, grind options)
- [x] Comisiones calculation
- [ ] Update hardcoded May 2026 delivery dates

### B2B caficultores
- [ ] Wire `CafiLista` form to `POST /api/caficultores/waitlist`
- [ ] Pull SCA tier prices from Firestore `configuration/pricing` (currently hardcoded in `CafiCalculator.tsx`)
- [ ] Configure `VITE_APP_TARGET=caficultores` on caficultores subdomain in hosting platform

## Deployment

CI/CD via GitHub Actions. Every push to `main` triggers a Firebase Hosting deploy. A separate scheduled workflow fetches the NY coffee commodity price daily and writes to Firestore.

For the caficultores subdomain, create a second hosting site pointing to the same repo with `VITE_APP_TARGET=caficultores` as a build environment variable.

## License

MIT
