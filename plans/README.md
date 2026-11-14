# Animation Plans — Tunay Wasi Landing

Planes generados a partir del análisis `find-animation-opportunities` + `improve-animations`.

## Planes

| # | Archivo | Título | Severity | Status | Depende de |
|---|---------|--------|----------|--------|------------|
| 001 | [001-mobile-nav-entrada-animada.md](001-mobile-nav-entrada-animada.md) | Entrada animada del menú mobile en los tres navbars | MEDIUM | TODO | — |
| 002 | [002-cart-drawer-items-stagger.md](002-cart-drawer-items-stagger.md) | Stagger de entrada de items en CartDrawer | LOW | TODO | — |
| 003 | [003-productcard-press-feedback.md](003-productcard-press-feedback.md) | Press feedback en botones +/– y selectores de ProductCard | LOW | TODO | — |
| 004 | [004-checkoutone-easing-coherente.md](004-checkoutone-easing-coherente.md) | Easing coherente en pantalla de confirmación de CheckoutONE | LOW | TODO | — |

## Orden de ejecución recomendado

1. **004** — 3 palabras cambiadas. Riesgo cero. Ejecutar primero para verificar el pipeline.
2. **003** — Añade `<style>` y `className` a ProductCard. Sin lógica nueva.
3. **001** — Toca 3 archivos (Nav, CafiNav, SupplyNav). Verificar las 3 apps en móvil.
4. **002** — El más complejo (requiere gestionar `openKey` + re-mount). Ejecutar último.

## Dependencias

Ningún plan depende de otro. Se pueden ejecutar en cualquier orden.

## Convenciones del proyecto

- Keyframes: definidos en template strings dentro de `<style>{` en JSX (sin archivos CSS separados).
- Curva principal: `cubic-bezier(.2,.7,.2,1)` (CartDrawer, FilterPanel). Los planes nuevos usan `cubic-bezier(0.23, 1, 0.32, 1)` (equivalente de AUDIT.md).
- Sin librería externa de animación — todo CSS puro.
- Commit base: `db6e64d`.
