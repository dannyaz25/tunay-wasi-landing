# 004 — Easing coherente en pantalla de confirmación de CheckoutONE

- **Status**: DONE
- **Commit**: db6e64d
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, 3 líneas

## Problem

`CheckoutONE.tsx:1367-1369` — Las clases `.tw-confirm-title`, `.tw-confirm-code` y `.tw-confirm-ctas` usan la curva `ease` genérica del navegador, mientras que el resto de la pantalla de confirmación usa `cubic-bezier(0.22,1,0.36,1)` (las clases `tw-step-1/2/3`).

```css
/* CheckoutONE.tsx:1367-1369 — estado actual */
.tw-confirm-title { animation: fadeSlideUp 0.4s ease 0.6s both; }
.tw-confirm-code  { animation: fadeSlideUp 0.4s ease 0.75s both; }
.tw-confirm-ctas  { animation: fadeSlideUp 0.4s ease 1.0s both; }
```

```css
/* CheckoutONE.tsx:1360-1362 — las clases hermanas, con curva fuerte */
.tw-step-1 { animation: stepFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
.tw-step-2 { animation: stepFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
.tw-step-3 { animation: stepFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
```

`ease` CSS nativo (`cubic-bezier(0.25, 0.1, 0.25, 1)`) es débil y genérico. En la misma pantalla coexisten dos curvas diferentes para el mismo tipo de movimiento (`fadeSlideUp` vs `stepFadeUp` son idénticos salvo por el offset Y: 10px vs 14px). La inconsistencia es perceptible en el flujo seguido: los pasos 1→2→3 entran con fuerte ease-out; luego el título y los CTAs entran con curva genérica.

## Target

Reemplazar `ease` por `cubic-bezier(0.22,1,0.36,1)` en las tres clases afectadas.

```css
/* target */
.tw-confirm-title { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
.tw-confirm-code  { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
.tw-confirm-ctas  { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 1.0s both; }
```

Los delays (0.6s, 0.75s, 1.0s) y duración (0.4s) no cambian — solo la curva.

## Repo conventions to follow

- `cubic-bezier(0.22,1,0.36,1)` es la curva ya usada en `CheckoutONE.tsx:1360-1362` para las clases `.tw-step-*`. Copiar exactamente ese valor.
- El bloque de estilos está en `CheckoutONE.tsx` dentro de `<style>{` en JSX (líneas ~1340-1370).

## Steps

### 1. Localizar las tres líneas en `CheckoutONE.tsx`

El bloque de `<style>` está en las últimas líneas del componente, aproximadamente en `CheckoutONE.tsx:1367-1369`.

### 2. Reemplazar `ease` por `cubic-bezier(0.22,1,0.36,1)` en las tres clases

**Código actual:**
```css
.tw-confirm-title { animation: fadeSlideUp 0.4s ease 0.6s both; }
.tw-confirm-code  { animation: fadeSlideUp 0.4s ease 0.75s both; }
.tw-confirm-ctas  { animation: fadeSlideUp 0.4s ease 1.0s both; }
```

**Código nuevo:**
```css
.tw-confirm-title { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
.tw-confirm-code  { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
.tw-confirm-ctas  { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 1.0s both; }
```

## Boundaries

- NO tocar `checkBounce`, `stepFadeUp`, ni las clases `tw-step-*` ni `tw-check-bounce`.
- NO modificar los delays ni duraciones.
- NO modificar ningún otro archivo.
- Cambio de 3 palabras `ease` → 3 cubic-bezier. Nada más.

## Verification

- **Mechanical**: `npm run build` sin errores.
- **Feel check**:
  - Completar el flujo de checkout hasta el paso 3 (confirmación).
  - Observar la secuencia: ✓ circle bounce → step cards (1, 2, 3) → título → código de pedido → CTAs.
  - Con DevTools → Animations panel al 10%: el título, código y CTAs deben desacelerarse con la misma curva pronunciada que los step cards, no con una curva suave genérica.
  - La diferencia es sutil pero consistente — el criterio es que la pantalla se sienta como una sola secuencia, no como dos animaciones distintas pegadas.
- **Done when**: toda la secuencia de confirmación usa la misma curva `cubic-bezier(0.22,1,0.36,1)`.
