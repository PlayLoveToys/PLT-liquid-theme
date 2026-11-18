# Fase 1: decisión sobre preflight de Tailwind

**Fecha:** 2026-11-18 (actualizado tras revisión CI & Quality / PR Bulma)  
**Contexto:** `docs/ds-port-plan.md` (Fase 1 residual / corte 2b). Dawn (`base.css`) y, hasta retirarlo, Bulma (`b-style.css`) cargan en `@layer legacy`; `assets/theme.css` aporta `theme` + `utilities` **sin** preflight.

**Relación con [PR #38 — retirada Bulma](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/38):** en el commit `93d72d9` (verificación **PLT CI & Quality**), ese PR **ya no activa** el preflight de Tailwind. Según CI & Quality, **quitar Bulma no es condición suficiente** para importar preflight: el harness `controls` con `LEGACY_LAYER=import` **pasa sin preflight** con o sin Bulma en el stack legacy. El preflight **sigue diferido** en el storefront y en este PR #36.

## Estado de la decisión

| Pregunta | Respuesta |
| --- | --- |
| ¿Activar preflight en Fase 1 / PR #36? | **No.** |
| ¿Activa preflight el PR #38 (Bulma)? | **No** (`93d72d9`, PLT CI & Quality). |
| ¿Cuándo replantear preflight? | Cuando el CSS de **Dawn** salga de `@layer legacy` en el layout global, se reduzca a plantillas/superficies acotadas, o exista un contenedor migrado donde el preflight no compita con resets de `base.css`. |
| ¿Bloqueo principal tras Bulma? | Los **resets de Tailwind** (capa `base`) siguen **por encima** de `legacy` y colisionan con reglas de elemento de **Dawn** en `base.css` (`button`, `input[type=checkbox]`, etc.), aunque Bulma ya no esté en la página. |

## Opciones evaluadas

| Opción | Descripción | Resultado |
| --- | --- | --- |
| **A. Preflight global en `@layer base`** | `@import "tailwindcss/preflight.css" layer(base)` en `styles/global.css` | **Descartada** — ver probe abajo. |
| **B. Preflight bajo contenedor** (p. ej. `.plt-ds-root`) | Reset solo en nodos migrados | Técnicamente viable pero requiere envolver cada superficie migrada y no cubre header/footer compartidos mientras Dawn siga en legacy global. |
| **C. Flag de theme + carga condicional** | Activar preflight solo si `settings` futuro | Sin setting aprobado; añadiría deuda sin gate claro. |
| **D. Mantener sin preflight** | Estado actual | **Elegida** (diferido). |

## Evidencia: probe local (`LEGACY_LAYER=import`)

Comandos (rama de trabajo):

```bash
# Baseline (sin preflight) — estado de producción de global.css
LEGACY_LAYER=import npm run harness:snippet -- controls
# → tools/snippet-harness/.out/controls.layered.html

# Preflight global (experimental, no commitear)
cp styles/global.css /tmp/global.css.bak
# Añadir tras @layer …: @import "tailwindcss/preflight.css" layer(base);
npm run build:css
LEGACY_LAYER=import npm run harness:snippet -- controls
mv /tmp/global.css.bak styles/global.css && npm run build:css
```

Salida del probe registrada en [`docs/fase1-gates-report.md`](fase1-gates-report.md).

### Por qué el preflight global rompe la convivencia legacy (con o sin Bulma)

Con capas `@layer legacy, theme, base, components, utilities` (layout + harness), el preflight vive en **`base`**, por encima de **`legacy`**. Las reglas de reset de Tailwind (márgenes en `body`, `button`, `input`, listas, etc.) **ganan** sobre lo que quede en `legacy`, incluido **solo Dawn** (`base.css`).

- **Con Bulma:** además, resets chocan con `button { padding: 0 }` y similares en `b-style.css` (corte 2b).
- **Sin Bulma ([PR #38](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/38)):** el conflicto **relevante para el harness `controls`** persiste por **Dawn** — p. ej. `input[type=checkbox] { width: auto }` y resets de `button` en `base.css`. PLT CI & Quality confirma que **no hace falta preflight** para que `controls` pase con `LEGACY_LAYER=import`; introducir preflight global **sí** reintroduce el patrón de controles rotos documentado en `docs/ds-port-plan.md` § corte 2b.

### Conclusión

**No hay forma segura de activar el preflight de Tailwind a escala storefront** mientras `base.css` (Dawn) siga cargándose en `@layer legacy` en el layout global. Retirar Bulma ([PR #38](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/38)) **no desbloquea** el preflight; reduce ruido Bulma pero **no** elimina el choque Dawn ↔ resets Tailwind.

**Ventana para preflight:** cuando el CSS de Dawn salga de `legacy` (retiro progresivo de `component-*.css` / `base.css` en favor del DS) o el preflight quede **acotado** a superficies sin Dawn en cascada (contenedor migrado, plantilla sin legacy global).

Este PR **no** añade preflight; documenta la decisión (diferida) y entrega el **mapeo de tokens** `--plt-*` desde `settings_schema`.

## Harness tras mapeo de tokens

El harness inyecta las mismas variables que el layout (`PLT_DS_TOKENS=1`, ver `tools/snippet-harness/render.mjs`) para validar que los consumidores `plt-*` / `d-*` reciben overrides del merchant sin Shopify Live.

```bash
PLT_DS_TOKENS=1 LEGACY_LAYER=import npm run harness:snippet -- controls
PLT_DS_TOKENS=1 LEGACY_LAYER=import npm run harness:snippet -- button
```

Salida: `tools/snippet-harness/.out/*.layered.html` (comparar visualmente antes/después del mapeo en el mismo entorno layered). Sin preflight — alineado con el gate de CI & Quality en [PR #38](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/38).