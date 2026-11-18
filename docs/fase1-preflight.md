# Fase 1: decisión sobre preflight de Tailwind

**Fecha:** 2026-11-18  
**Contexto:** `docs/ds-port-plan.md` (Fase 1 residual / corte 2b). Legacy Dawn + Bulma (~411 usos `b-*`) cargado en `@layer legacy`; `assets/theme.css` aporta `theme` + `utilities` **sin** preflight.

## Opciones evaluadas

| Opción | Descripción | Resultado |
| --- | --- | --- |
| **A. Preflight global en `@layer base`** | `@import "tailwindcss/preflight.css" layer(base)` en `styles/global.css` | **Descartada** — ver probe abajo. |
| **B. Preflight bajo contenedor** (p. ej. `.plt-ds-root`) | Reset solo en nodos migrados | Técnicamente viable pero requiere envolver cada superficie migrada y no cubre header/footer compartidos en legacy. Coste alto para beneficio acotado en Fase 1. |
| **C. Flag de theme + carga condicional** | Activar preflight solo si `settings` futuro | Sin setting aprobado; añadiría deuda sin gate claro. |
| **D. Mantener sin preflight** | Estado actual | **Elegida** hasta retirar Bulma (Fase 5 del plan). |

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

### Por qué el preflight global rompe la convivencia legacy

Con capas declaradas `@layer legacy, theme, base, components, utilities` (layout + harness), el preflight vive en **`base`**, por encima de **`legacy`**. Las reglas de reset de Tailwind (márgenes en `body`, `button`, `input`, listas, etc.) **ganan** a Dawn/Bulma aunque el markup siga siendo `b-*` o clases Dawn.

Eso es lo inverso del problema ya documentado en el corte 2b (legacy **sin** capa pisaba al DS). Introducir preflight global repite el conflicto en toda la página, no solo en snippets migrados.

El caso `controls` del harness con `LEGACY_LAYER=import` es el control de regresión aceptado: cantidad, filtros y orden se ven correctos **sin** preflight. Con preflight global (probe), los mismos componentes heredan resets de elemento que colisionan con Bulma (`button { padding: 0 }`) y Dawn (`input[type=checkbox]`), recreando el patrón de controles rotos descrito en `docs/ds-port-plan.md` § corte 2b.

### Conclusión

**No hay forma segura de activar el preflight de Tailwind a escala storefront** mientras coexistan `base.css` y `b-style.css` en la misma página. La ruta del plan sigue siendo **Fase 5** (retirar Bulma → entonces importar preflight en `base` o cargar solo `theme.css` completo).

Este PR **no** añade preflight; documenta la decisión y entrega el **mapeo de tokens** `--plt-*` desde `settings_schema`.

## Harness tras mapeo de tokens

El harness inyecta las mismas variables que el layout (`PLT_DS_TOKENS=1`, ver `tools/snippet-harness/render.mjs`) para validar que los consumidores `plt-*` / `d-*` reciben overrides del merchant sin Shopify Live.

```bash
PLT_DS_TOKENS=1 LEGACY_LAYER=import npm run harness:snippet -- controls
PLT_DS_TOKENS=1 LEGACY_LAYER=import npm run harness:snippet -- button
```

Salida: `tools/snippet-harness/.out/*.layered.html` (comparar visualmente antes/después del mapeo en el mismo entorno layered).