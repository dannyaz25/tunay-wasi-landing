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