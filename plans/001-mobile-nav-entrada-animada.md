# 001 — Entrada animada del menú mobile en los tres navbars

- **Status**: DONE
- **Commit**: db6e64d
- **Severity**: MEDIUM
- **Category**: Missed opportunity (Preventing a jarring change)
- **Estimated scope**: 3 files, ~10 líneas por archivo

## Problem

Los tres navbars del proyecto usan `{menuOpen && (...)}` para mostrar/ocultar el menú mobile. El panel se monta y desmonta en el DOM instantáneamente — aparece y desaparece sin ninguna transición.

**`Nav.tsx:93`** — B2C:
```tsx
{/* Mobile dropdown */}
{menuOpen && (
  <div className="tw-mobile-nav">
```

**`CafiNav.tsx:94`** — Landing caficultores:
```tsx
{menuOpen && (
  <div style={{
    padding: '20px 36px 28px',
    borderTop: '1px solid #f2e0cc11',
    background: 'rgba(24, 37, 32, 0.97)',
  }}>
```

**`SupplyNav.tsx:88`** — Landing mayoristas:
```tsx
{menuOpen && (
  <div style={{
    padding: '20px 36px 28px',
    borderTop: '1px solid #f2e0cc11',
    background: 'rgba(24, 37, 32, 0.97)',
  }}>
```

El hamburger ya anima sus líneas con `transition: 'all .3s ease'` (Nav.tsx:85-87, CafiNav.tsx:86-88, SupplyNav.tsx:80-82). El panel que aparece no tiene entrada — inconsistencia notoria.

## Target

Añadir un `@keyframes tw-mobile-nav-in` a cada navbar con `opacity 0→1` + `translateY(-8px→0)`, 200ms, `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out del catálogo de AUDIT.md).

El cierre es desmontaje instantáneo — aceptable para mobile (el usuario ya vio el hamburger colapsarse). Implementar un cierre animado requeriría estado `closing` extra; la ganancia no justifica la complejidad en este caso.

```css
/* target — añadir en el <style> de cada navbar */
@keyframes tw-mobile-nav-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tw-mobile-nav-panel {
  animation: tw-mobile-nav-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
```

```tsx
/* target — añadir className al div del panel en cada navbar */
<div className="tw-mobile-nav-panel tw-mobile-nav">  {/* Nav.tsx */}
<div className="tw-mobile-nav-panel" style={{ ... }}>  {/* CafiNav.tsx, SupplyNav.tsx */}
```

## Repo conventions to follow

- Curvas existentes en el proyecto: `cubic-bezier(.2,.7,.2,1)` (CartDrawer.tsx:105), `cubic-bezier(.2,.7,.2,1)` (FilterPanel.tsx:57). La curva `cubic-bezier(0.23, 1, 0.32, 1)` del catálogo AUDIT.md es funcionalmente equivalente — strong ease-out.
- Todos los keyframes del proyecto están definidos dentro de `<style>{` en JSX. Añadir en el `<style>` existente de cada componente, no en un archivo CSS separado.
- `Nav.tsx` usa la clase CSS `tw-mobile-nav` en el `<style>` existente (línea 132). El nuevo `@keyframes` y la nueva regla `.tw-mobile-nav-panel` van en ese mismo bloque.
- `CafiNav.tsx` y `SupplyNav.tsx` no tienen clase en el panel — solo style inline. Añadir `className="tw-mobile-nav-panel"` y la regla CSS correspondiente.

## Steps

### Paso 1 — Nav.tsx

**Archivo**: `src/components/layout/Nav.tsx`

1a. En el `<div className="tw-mobile-nav">` (línea 94), añadir también `className="tw-mobile-nav-panel tw-mobile-nav"`:

```tsx
// línea 94 — antes
<div className="tw-mobile-nav">

// línea 94 — después
<div className="tw-mobile-nav-panel tw-mobile-nav">
```

1b. En el bloque `<style>` existente (que empieza en `Nav.tsx:123`), añadir el keyframe y la regla **antes** del `@media (max-width: 880px)`:

```css
@keyframes tw-mobile-nav-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tw-mobile-nav-panel {
  animation: tw-mobile-nav-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
```

### Paso 2 — CafiNav.tsx

**Archivo**: `src/features/caficultores/components/CafiNav.tsx`

2a. En el `<div style={{ padding: '20px 36px 28px', ... }}>` del menú mobile (línea 95), añadir `className="tw-cafi-mobile-panel"` (namespace propio para evitar colisión):

```tsx
// antes
<div style={{
  padding: '20px 36px 28px',
  borderTop: '1px solid #f2e0cc11',
  background: 'rgba(24, 37, 32, 0.97)',
}}>

// después
<div className="tw-cafi-mobile-panel" style={{
  padding: '20px 36px 28px',
  borderTop: '1px solid #f2e0cc11',
  background: 'rgba(24, 37, 32, 0.97)',
}}>
```

2b. En el bloque `<style>` existente (línea 124), añadir antes del `@media`:

```css
@keyframes tw-cafi-nav-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tw-cafi-mobile-panel {
  animation: tw-cafi-nav-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
```

### Paso 3 — SupplyNav.tsx

**Archivo**: `src/features/mayoristas/components/SupplyNav.tsx`

3a. En el `<div style={{ padding: '20px 36px 28px', ... }}>` del menú mobile (línea 89), añadir `className="tw-sup-mobile-panel"`:

```tsx
// antes
<div style={{
  padding: '20px 36px 28px',
  borderTop: '1px solid #f2e0cc11',
  background: 'rgba(24, 37, 32, 0.97)',
}}>

// después
<div className="tw-sup-mobile-panel" style={{
  padding: '20px 36px 28px',
  borderTop: '1px solid #f2e0cc11',
  background: 'rgba(24, 37, 32, 0.97)',
}}>
```

3b. En el bloque `<style>` existente (línea 115), añadir antes del `@media`:

```css
@keyframes tw-sup-nav-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tw-sup-mobile-panel {
  animation: tw-sup-nav-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
```

## Boundaries

- NO tocar la animación del hamburger (las 3 spans con `transition: 'all .3s ease'`) — ya está bien.
- NO modificar los links ni el CTA dentro del panel.
- NO añadir estado `closing` — el desmontaje instantáneo es aceptable aquí.
- NO tocar `AppClientes.tsx`, `AppCaficultores.tsx`, `AppMayoristas.tsx` ni ningún otro componente.

## Verification

- **Mechanical**: `npm run build` (o `vite build`) sin errores de TypeScript. `npm run dev` debe servir sin errores de consola.
- **Feel check** (en móvil físico o DevTools → 375px):
  - Tocar el hamburger — el panel debe deslizarse suavemente desde arriba (~8px) mientras aparece.
  - Tocar el hamburger de nuevo para cerrar — el panel desaparece (sin animación — correcto).
  - Repetir 3 veces seguidas — la animación no debe acumularse ni "saltar".
  - Verificar en DevTools → Animations panel con velocidad 10%: el panel baja suavemente con ease-out fuerte.
  - Los tres navbars (B2C, caficultores, mayoristas) deben comportarse igual.
- **Done when**: los tres menús mobile tienen entrada animada y el cierre es limpio.
