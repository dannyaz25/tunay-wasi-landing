# 003 — Press feedback en botones +/– y selectores de ProductCard

- **Status**: DONE
- **Commit**: db6e64d
- **Severity**: LOW
- **Category**: Physicality & origin (press feedback)
- **Estimated scope**: 1 file, ~20 líneas

## Problem

`ProductCard.tsx:265-267` — Los botones `−` y `+` de cantidad no tienen ningún feedback de press. El `onClick` responde, pero visualmente no hay confirmación táctil ni de ratón.

```tsx
// ProductCard.tsx:265 — estado actual
<button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={isAgotado} style={{ width: 36, height: 40, border: 'none', background: 'transparent', cursor: isAgotado ? 'not-allowed' : 'pointer', fontSize: 16, color: '#1f3028' }}>−</button>
...
<button onClick={() => setQty((q) => Math.min(computedMaxQty, q + 1))} disabled={isAgotado || qty >= computedMaxQty} style={{ width: 36, height: 40, border: 'none', background: 'transparent', cursor: isAgotado || qty >= computedMaxQty ? 'not-allowed' : 'pointer', fontSize: 16, color: '#1f3028' }}>+</button>
```

Adicionalmente, los botones de selección de formato de molienda (`Grano`/`Molido`, línea 193) y los botones de peso (`250g`/`1kg`/`3kg`, línea 217) tampoco tienen feedback de press — solo `onClick`.

El único `:active` en todo el proyecto está en `CafiCalculator.tsx:229` (slider thumb). Todos los botones funcionales del catálogo carecen de este feedback básico.

## Target

Añadir press feedback vía clases CSS en el `<style>` que debe crearse en `ProductCard.tsx`. Target del AUDIT.md: `transform: scale(0.97)` en `:active` con `transition: transform 160ms ease-out`.

Usar clases CSS (no event handlers JS) para que el navegador lo maneje en el compositor — más performante y no requiere estado React.

```css
/* target — añadir en <style> de ProductCard.tsx */
.tw-pc-btn-qty:active:not(:disabled) {
  transform: scale(0.90);
  transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tw-pc-btn-qty {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tw-pc-btn-selector:active {
  transform: scale(0.95);
  transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tw-pc-btn-selector {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
```

Nota: los botones +/– son pequeños (36×40px) — `scale(0.90)` es más visible que el `0.97` de AUDIT.md para elementos de ese tamaño. Los selectores de peso/molienda son más grandes — `scale(0.95)` es más apropiado.

## Repo conventions to follow

- `ProductCard.tsx` actualmente no tiene `<style>`. Añadir un bloque `<style>` como hacen todos los demás componentes interactivos del proyecto (CartDrawer, Nav, CafiNav, CafiCalculator, etc.).
- Curva `cubic-bezier(.2,.7,.2,1)` es la más usada en el proyecto. `cubic-bezier(0.23, 1, 0.32, 1)` de AUDIT.md es equivalente — usar esta para consistencia con los nuevos planes.
- El componente ya tiene `@media (hover: hover)` implícito vía hover states en el artículo padre. Los `:active` states funcionan tanto en hover como en touch.

## Steps

### 1. Añadir el bloque `<style>` en ProductCard.tsx

Insertar justo antes del `return (` del componente:

```tsx
return (
  <>
    <style>{`
      .tw-pc-btn-qty {
        transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
      }
      .tw-pc-btn-qty:active:not(:disabled) {
        transform: scale(0.90);
        transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
      }
      .tw-pc-btn-selector {
        transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
      }
      .tw-pc-btn-selector:active {
        transform: scale(0.95);
        transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
      }
    `}</style>
    <article ...>
```

### 2. Añadir `className="tw-pc-btn-qty"` a los botones −/+

Localizar los dos botones en `ProductCard.tsx:265-267`:

```tsx
// − botón — añadir className
<button
  className="tw-pc-btn-qty"
  onClick={() => setQty((q) => Math.max(1, q - 1))}
  disabled={isAgotado}
  style={{ width: 36, height: 40, border: 'none', background: 'transparent', cursor: isAgotado ? 'not-allowed' : 'pointer', fontSize: 16, color: '#1f3028' }}
>−</button>

// + botón — añadir className
<button
  className="tw-pc-btn-qty"
  onClick={() => setQty((q) => Math.min(computedMaxQty, q + 1))}
  disabled={isAgotado || qty >= computedMaxQty}
  style={{ width: 36, height: 40, border: 'none', background: 'transparent', cursor: isAgotado || qty >= computedMaxQty ? 'not-allowed' : 'pointer', fontSize: 16, color: '#1f3028' }}
>+</button>
```

### 3. Añadir `className="tw-pc-btn-selector"` a los botones de modo de molienda

Localizar los botones `Grano`/`Molido` en `ProductCard.tsx:193`. Añadir `className="tw-pc-btn-selector"` a cada uno sin quitar sus demás props.

### 4. Añadir `className="tw-pc-btn-selector"` a los botones de peso

Localizar el `.map()` de pesos en `ProductCard.tsx:217`. Añadir `className="tw-pc-btn-selector"` al elemento interactivo (button o div con onClick).

## Boundaries

- NO modificar la lógica de `handleReservar`, `setQty`, `setGrindMode`, `setWeightIdx`.
- NO tocar `ImageSlot`, `CartDrawer`, ni `useCartActions`.
- NO añadir dependencias.
- Solo añadir `className` a los elementos y el bloque `<style>`.

## Verification

- **Mechanical**: `npm run build` sin errores TypeScript. TypeScript no valida CSS strings — verificar manualmente que los selectores son correctos.
- **Feel check** (desktop y móvil):
  - En la ProductCard del catálogo, hacer click/tap en `−` y `+` — deben "hundirse" visiblemente al presionar.
  - Los botones deshabilitados (`disabled`) no deben animarse.
  - Los selectores de molienda y peso deben tener el mismo feedback al tocarlos.
  - DevTools → slow 3G + Animations 10%: la escala debe verse claramente.
- **Done when**: todos los botones interactivos de ProductCard tienen feedback táctil/visual al presionar.
