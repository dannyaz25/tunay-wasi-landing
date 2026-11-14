# 002 — Stagger de entrada de items en CartDrawer

- **Status**: DONE
- **Commit**: db6e64d
- **Severity**: LOW
- **Category**: Cohesion & tokens (stagger)
- **Estimated scope**: 1 file, ~15 líneas

## Problem

`CartDrawer.tsx:135` — Los items del carrito aparecen todos simultáneamente cuando el drawer se abre. El drawer en sí ya tiene una transición suave (`.55s cubic-bezier(.2,.7,.2,1)`), pero los items dentro teleportan al mismo tiempo.

```tsx
// CartDrawer.tsx:135 — estado actual
{items.length === 0 ? <EmptyCart /> : items.map((it) => <CartItemRow key={it.id} item={it} />)}
```

El drawer se abre ocasionalmente (2–4 veces por sesión de compra) — frecuencia correcta para este nivel de delight.

## Target

Stagger de entrada: cada `CartItemRow` aparece con `opacity 0→1` + `translateY(10px→0)` y un delay incremental de 45ms, limitado a los primeros 4 items (índices 0–3). Items adicionales entran sin delay.

```tsx
// target — CartItemRow recibe index, aplica animation delay via CSS variable
{items.map((it, i) => (
  <div
    key={it.id}
    className="tw-cart-item-enter"
    style={{ '--cart-item-delay': `${Math.min(i, 3) * 45}ms` } as React.CSSProperties}
  >
    <CartItemRow item={it} />
  </div>
))}
```

```css
/* target — añadir en el <style> de CartDrawer.tsx */
@keyframes tw-cartitem-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tw-cart-item-enter {
  animation: tw-cartitem-in 220ms cubic-bezier(0.23, 1, 0.32, 1) var(--cart-item-delay, 0ms) both;
}
```

El stagger solo debe ejecutarse cuando el drawer **abre**. Si ya está abierto y se añade un item, no debe re-animar toda la lista. Ver implementación con `key` de re-mount en Step 3.

## Repo conventions to follow

- `cubic-bezier(.2,.7,.2,1)` es la curva de referencia del drawer en `CartDrawer.tsx:105`. Usar `cubic-bezier(0.23, 1, 0.32, 1)` (equivalente strong ease-out de AUDIT.md) para los items.
- Keyframes definidos en template string dentro de `<style>` en JSX — mismo patrón que `CartDrawer.tsx:100-103`.
- CSS custom properties como `--cart-item-delay` para el stagger — patrón reconocible en React inline styles.

## Steps

### 1. Añadir el `<style>` con el keyframe en CartDrawer.tsx

Localizar el bloque `<style>` existente en `CartDrawer.tsx:100-103`:

```tsx
<style>{`
  @keyframes tw-logo-hover { ... }
  @keyframes tw-logo-breathe { ... }
`}</style>
```

Añadir dentro del mismo bloque (no crear un segundo `<style>`):

```tsx
<style>{`
  @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
  @keyframes tw-cartitem-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tw-cart-item-enter {
    animation: tw-cartitem-in 220ms cubic-bezier(0.23, 1, 0.32, 1) var(--cart-item-delay, 0ms) both;
  }
`}</style>
```

### 2. Envolver cada `CartItemRow` con el div animado

Localizar la línea 135 de `CartDrawer.tsx`:

```tsx
// antes
{items.length === 0 ? <EmptyCart /> : items.map((it) => <CartItemRow key={it.id} item={it} />)}

// después
{items.length === 0 ? (
  <EmptyCart />
) : (
  items.map((it, i) => (
    <div
      key={it.id}
      className="tw-cart-item-enter"
      style={{ '--cart-item-delay': `${Math.min(i, 3) * 45}ms` } as React.CSSProperties}
    >
      <CartItemRow item={it} />
    </div>
  ))
)}
```

### 3. Controlar que el stagger solo ocurra al abrir el drawer

El stagger con `animation ... both` se reproducirá cada vez que el componente se monta. Como `CartDrawer` permanece montado (usa `opacity`/`transform` para ocultar, no desmontaje), la animación solo se ejecutará si se fuerza un re-mount de los items.

Añadir un `key` que cambie cuando el drawer se abre, usando el timestamp del evento:

```tsx
// Añadir estado en CartDrawer
const [openKey, setOpenKey] = useState(0);

// En el useEffect existente que maneja isOpen
useEffect(() => {
  if (isOpen) {
    setOpenKey(k => k + 1);
    // ... resto del código del useEffect existente
  }
  // ...
}, [isOpen, close]);
```

Luego usar `openKey` en el `key` del wrapper:

```tsx
items.map((it, i) => (
  <div
    key={`${openKey}-${it.id}`}  // cambia al abrir → re-monta → re-ejecuta animación
    className="tw-cart-item-enter"
    style={{ '--cart-item-delay': `${Math.min(i, 3) * 45}ms` } as React.CSSProperties}
  >
    <CartItemRow item={it} />
  </div>
))
```

## Boundaries

- NO modificar `CartItemRow` ni su lógica interna.
- NO tocar la animación del drawer (`transform: translateX`) ni el overlay.
- NO tocar `CartButton.tsx` ni el Zustand store.
- El wrapper `div.tw-cart-item-enter` debe ser un `div` simple sin flex/grid propio — el layout lo manejan el padre y `CartItemRow`.

## Verification

- **Mechanical**: `npm run build` sin errores TypeScript.
- **Feel check**:
  - Añadir 3+ productos al carrito.
  - Abrir el CartDrawer — los items deben aparecer escalonados (el primero antes, el último con ~135ms de delay).
  - Cerrar y abrir de nuevo — la animación debe repetirse.
  - Añadir un item con el drawer ya abierto — el nuevo item debe entrar solo (sin re-animar los existentes).
  - DevTools → Animations panel al 10%: stagger visible entre items.
- **Done when**: los items del carrito entran escalonados al abrir el drawer.
