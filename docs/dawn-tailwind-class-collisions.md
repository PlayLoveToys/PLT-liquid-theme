# Colisiones Dawn (`@layer legacy`) vs utilidades Tailwind (`@layer utilities`)

**Fecha:** 2026-11-18  
**Contexto:** `layout/theme.liquid` declara `@layer legacy, theme, base, components, utilities;`, importa `theme.css` (sin capa) y `base.css` dentro de `layer(legacy)`. Las utilidades de Tailwind viven en `@layer utilities` y **ganan** a `legacy` a igualdad de especificidad.

## Solución adoptada (opción b + puente mínimo)

1. **`@source not inline("grid")`** en `styles/global.css` — deja de generarse la utilidad global `.grid { display: grid }`.
2. **Puente en `@layer utilities`** — `.grid` con clases Tailwind de pista (`grid-cols-*`, `col-span-*`, …) recupera `display: grid` sin afectar marcado Dawn (`grid--*`, `.grid__item`).
3. **`flex-wrap: nowrap`** en `@layer utilities` para `.grid.slider*` — los sliders Dawn usan `flex-wrap: inherit` en `component-slider.css`; sin esto heredan `wrap` de `.grid` y el carril horizontal se rompe.
4. **Retirado** `assets/plt-dawn-grid-compat.css` (parche Alpine Migrator #48).
5. **a-matrix:** `col-span-12 md:col-span-6 xl:col-span-3` en bloques `b-card-*` (sustituye reglas del compat retirado).

**Por qué no prefijo ni opción (c):** prefijo Tailwind obligaría a tocar markup Dawn masivo y vendors DS; sacar solo reglas `.grid` de `base.css` duplica Dawn y aumenta riesgo en merges upstream. Excluir una utilidad + puente acotado es la menor superficie.

## Colisiones auditadas (`base.css` vs `theme.css`)

| Clase / utilidad | Dawn (`base.css`) | Tailwind (`theme.css`) | Impacto en storefront | Acción en este PR |
|------------------|-------------------|------------------------|------------------------|-------------------|
| `.grid` | `display: flex` + `flex-wrap: wrap` | ~~`display: grid`~~ (excluida) | Rompía colecciones, PDP 2 col, footer, sliders | Excluir + puente + nowrap sliders |
| `.hidden` | `display: none` | `display: none` | Equivalente funcional | Documentar |
| `.isolate` | (Dawn: aislamiento de stacking) | `isolation: isolate` | Bajo en grillas; revisar z-index si aparece bug | Documentar |
| `.overflow-hidden` | overflow en componentes Dawn | utilidad TW | Bajo salvo conflictos de scroll | Documentar |
| `.uppercase` | tipografía Dawn | `text-transform` TW | Bajo | Documentar |
| `.flex` | no en raíz Dawn | `display: flex` | Dawn no redefine; TW gana solo si clase presente | Sin cambio |
| `.container` | ancho Dawn en legacy | breakpoints TW | Posible conflicto en marcado mixto | Documentar; no en alcance |
| `.underline` | subrayado Dawn | utilidad TW | Bajo | Documentar |
| `.list-unstyled` vs `.list-none` | Dawn usa `list-unstyled` | TW `list-none` | Sin colisión de nombre | N/A |

### Fuera de alcance (documentación de posible mismo mecanismo)

Tras restaurar Dawn `.grid` como flex, **no** se corrigen en este PR (otro PR Alpine Migrator / componente):

- Input de cantidad 0×0 (`component` quantity) — revisar si hay utilidad TW o reset de capas; probable interacción con `display`/`width` del componente, no solo `.grid`.
- `field__input` del newsletter en footer — estilos en `base.css` `@layer legacy`; si faltan, puede ser orden de capas vs utilidades TW en el input, no la colisión `.grid`.
- Hero de artículo y collection-list móvil — mismo lote de CSS de componente; no editar aquí.

## Archivos de configuración / build

- `styles/global.css` — exclusión y puentes.
- `assets/theme.css` — regenerar con `npm run build:css`.
- `layout/theme.liquid` — sin hoja `plt-dawn-grid-compat.css`.

## Referencias

- `docs/ds-port-plan.md` (orden de capas).
- Harness: casos `dawn-flex-grids`, `featured-collection-slider`, `collection-product-grid`, `a-matrix-blocks`.