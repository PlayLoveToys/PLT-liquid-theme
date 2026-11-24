# Fase 1: decisión sobre preflight de Tailwind

**Fecha:** 2026-11-18 (sincronizado con `dev-ai`, head ≥ `9a8593d`, incl. [#33](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/33) `a-logo-motto`)  
**Contexto:** `docs/ds-port-plan.md`. Legacy actual: **solo Dawn** (`base.css` en `@layer legacy` vía `layout/theme.liquid`). **Bulma** (`b-style.css`) y **Alpine** (cart / directives en layout) **ya retirados** en `dev-ai` tras [PR #38](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/38). `assets/theme.css` sigue con capas `theme` + `utilities`, **sin** `@import "tailwindcss/preflight.css"`.

**Confirmación en `dev-ai`:** `styles/global.css` **no importa preflight** (comentario explícito en el fichero). Este PR #36 **no lo activa**; el preflight **sigue diferido** hasta decisión de producto (Alejandro).

## Estado de la decisión

| Pregunta | Respuesta |
| --- | --- |
| ¿Activar preflight en PR #36? | **No** (cambio visual global; requiere aprobación explícita). |
| ¿Lo activó PR #38 (Bulma/Alpine)? | **No** — integrado en `dev-ai` sin preflight. |
| ¿Cuándo replantear? | Cuando **`base.css` (Dawn)** salga de `@layer legacy` en el layout global, o el preflight quede **acotado** a superficies sin Dawn en cascada. |
| ¿Bloqueo tras retirar Bulma/Alpine? | **Sí:** el preflight en `@layer base` queda **por encima** de `legacy` y compite con resets de Dawn; ver probe post-`dev-ai` abajo. |

## Opciones evaluadas

| Opción | Descripción | Resultado |
| --- | --- | --- |
| **A. Preflight global en `@layer base`** | `@import "tailwindcss/preflight.css" layer(base)` | **Descartada para merge** — probe 2026-11-18 post-`dev-ai` sigue mostrando regresión en harness. |
| **B. Preflight bajo contenedor** | Reset en `.plt-ds-root` o similar | Viable a futuro; no en Fase 1. |
| **C. Flag en theme settings** | Carga condicional | Sin setting aprobado. |
| **D. Mantener sin preflight** | Estado `dev-ai` | **Elegida** (diferido). |

## Probe post-Bulma / post-Alpine (2026-11-18)

Entorno: rama #36 mergeada con `origin/dev-ai`, harness `controls`, `LEGACY_LAYER=import`, legacy **solo `base.css`** (sin `b-style.css`). Probe **experimental** (no commiteado): añadir preflight en `styles/global.css`, `npm run build:css`, medir con Playwright en `tools/snippet-harness/.out/controls.layered.html`, restaurar `global.css`.

### Resultados (resumen)

| Métrica | Sin preflight | Con preflight (`layer(base)`) |
| --- | --- | --- |
| `plt-quantity-selector` (caja host) | ≈ **171×44** px | ≈ **145×40** px (encoge) |
| Checkboxes en filter-bar (muestra) | mayoría **24×24** px | muchas pass **0×0** (no renderizadas) |
| `d-btn` padding vertical | `1px` (layered) | **`0px`** (preflight gana a legacy) |

**Conclusión del probe:** retirar Bulma y Alpine **no elimina** el choque preflight ↔ Dawn. El harness `controls` **pasa sin preflight** (gate `test:harness` / CI en #38). Con preflight global el caso `controls` sigue mostrando **regresión visual** en cantidad/filtros (misma clase de problema que corte 2b, ahora atribuible sobre todo a **`base.css`**).

**Propuesta (no implementada en #36):** no activar preflight global en storefront hasta sacar Dawn de `legacy` o acotarlo. Si Alejandro aprueba un rollout visual, abrir PR dedicado con capturas y gates visuales; Fase 1 solo documenta la viabilidad negativa del probe.

## Evidencia reproducible

```bash
# Baseline (como dev-ai / #36)
LEGACY_LAYER=import npm run harness:snippet -- controls

# Probe local (no dejar commiteado)
# 1) Añadir: @import "tailwindcss/preflight.css" layer(base);
# 2) npm run build:css && LEGACY_LAYER=import npm run harness:snippet -- controls
# 3) Revertir global.css y npm run build:css
```

Salida histórica previa: [`docs/fase1-gates-report.md`](fase1-gates-report.md) (incluye gates post-merge).

## Harness + tokens (este PR)

```bash
PLT_DS_TOKENS=1 LEGACY_LAYER=import npm run harness:snippet -- controls
PLT_DS_TOKENS=1 LEGACY_LAYER=import npm run harness:snippet -- button
```

Este PR **no** añade preflight; entrega **mapeo** `--plt-*` via `snippets/_plt-ds-token-vars.liquid`. Decisiones de producto pendientes: [`docs/fase1-settings-token-map.md`](fase1-settings-token-map.md) (fuente accent, bordes/sombras, semánticos, radios de cards).