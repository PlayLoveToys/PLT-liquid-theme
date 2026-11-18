# Colisiones Dawn (`@layer legacy`) vs utilidades Tailwind (`@layer utilities`)

**Fecha:** 2026-11-18 (actualizado post-#49)  
**Contexto:** `layout/theme.liquid` declara `@layer legacy, theme, base, components, utilities;`, importa `theme.css` (sin capa) y `base.css` dentro de `layer(legacy)`. Las utilidades de Tailwind viven en `@layer utilities` y **ganan** a `legacy` a igualdad de especificidad.

## Solución adoptada (opción b + puente mínimo)

1. **`@source not inline("{sm:,md:,lg:,xl:,2xl:,}grid")`** en `styles/global.css` — no se generan utilidades `.grid` / `md:grid` / … (`display: grid`).
2. **Puente en `@layer utilities`** — `.grid` con utilidades de pista Tailwind recupera `display: grid` (ver lista abajo).
3. **`flex-wrap: nowrap`** en `@layer utilities` para `.grid.slider*`.
4. **Retirado** `assets/plt-dawn-grid-compat.css` (aunque #48 lo reintrodujera en `dev-ai`; merge #50 lo mantiene fuera).
5. **a-matrix:** `col-span-12 md:col-span-6 xl:col-span-3` en bloques `b-card-*`.

**Variantes responsivas `md:grid`:** excluidas del build. No hay usos en markup propio sin `grid-cols-*`; el puente usa el atributo `class` completo (`md:grid-cols-12` coincide con `[class*='grid-cols']`).

### Pistas cubiertas por el puente (`display: grid`)

`grid-cols-*`, `col-span-*`, `row-span-*`, `grid-rows-*`, `grid-flow-*`, `auto-rows-*`, `auto-cols-*`, `place-items-*`, `place-content-*`, `justify-items-*`.

## Auditoría: token de clase `grid` en markup propio

Ámbito: `sections/`, `blocks/`, `snippets/` (excl. `plt-*`), `layout/`, plantillas liquid en repo. Harness/tools listados aparte.

### A) Intención Tailwind (debe verse `display: grid` vía puente)

| Ubicación | Clases relevantes | Estado |
|-----------|-------------------|--------|
| `sections/a-matrix.liquid` | `grid grid-cols-12` | OK — puente |
| `sections/a-logo-motto.liquid` | `grid … md:grid-cols-12` | OK — `grid-cols` en atributo |
| `sections/aa-hero-toggle-content.liquid` | `grid grid-cols-1 … md:grid-cols-12` | OK |
| `sections/main-collection-sanity.liquid` (hero) | `grid grid-cols-1 … md:grid-cols-12` | OK |
| `snippets/_collection-hero-collapsable-content.liquid` | idem | OK |
| `snippets/aa-banner-slice.liquid` | idem | OK |
| `blocks/_aa-banner-slice.liquid` | idem | OK |
| `snippets/c-card-products-grid.liquid` | `grid grid-cols-2 … sm:grid-cols-3` | OK |
| `snippets/c-card-collections-grid.liquid` | `grid grid-cols-2` | OK |
| DS pin (`incentive-bar.liquid` vía `@source`) | `grid grid-cols-1 md:grid-cols-3` | OK — puente sin subir pin |

**No encontrado en markup propio:** `grid` solo con `gap-*` / `place-items-*` / `grid-rows-*` sin `grid-cols`; `md:grid` sin `grid-cols`; arbitrarios `[grid-template-areas]`.

### B) Intención Dawn flex (`grid--*`, `.grid__item`; debe quedar `display: flex`)

| Patrón | Ejemplos | Estado |
|--------|----------|--------|
| Grillas producto | `main-collection`, `main-search`, `featured-collection`, `related-products`, … | OK — sin pista TW |
| PDP | `main-product` → `.product.grid.grid--2-col-tablet` | OK — harness `main-product-pdp-shell` |
| Footer | `footer__blocks-wrapper grid grid--…` | OK — `dawn-flex-grids` |
| Multicolumn / slideshow / blog sliders | `grid … slider--mobile` | OK — flex + nowrap utilities |
| `multicolumn-2x2.liquid` | `div.grid.w-full` (wrapper Dawn) | OK — flex; `w-full` es utilidad TW |
| `image-with-text` / `multirow` / `collapsible-content` | `grid grid--gapless grid--N-col…` | OK |
| `featured-product.liquid` | `grid … isolate grid--2-col-tablet` | OK flex; ver nota `isolate` abajo |

### C) Otros (no usan utilidad Tailwind `.grid`)

| Ubicación | Nota |
|-----------|------|
| `blocks/modern_blog_layout.liquid` | `tw-grid tw-grid-cols-*` (prefijo distinto; no afectado por exclusión de `.grid`) |
| `blocks/glossary-term-related-links.liquid`, `masonry-collections.liquid`, `modern-2-column-blog.liquid` | `display: grid` en `<style>` inline, sin clase `.grid` |
| `layout/theme.liquid` | `grid-template-rows` en `{% style %}`, sin clase `.grid` |
| JSON schema `value: "grid"` en slideshow / blog | Config Dawn, no clase CSS TW |

## Utilidades responsivas `md:grid` / `lg:grid`

Excluidas explícitamente junto con `.grid`. Si en el futuro se necesitan sin `grid-cols-*`, habría que añadir utilidad con otro nombre (p. ej. `tw-layout-grid`) o ampliar el puente — hoy no hay casos en el theme.

## Colisiones adicionales (`base.css` vs `theme.css`)

| Clase | Dawn | Tailwind | Acción |
|-------|------|----------|--------|
| `.hidden` | `display: none` | `display: none` | Documentar; share-button usa `hidden` en PDP |
| `.isolate` | stacking Dawn | `isolation: isolate` | `featured-product` combina ambos; equivalente funcional |
| `.overflow-hidden` | componentes | utilidad TW | Documentar |
| `.uppercase` | tipografía | TW | Documentar |

### `.share-button__fallback` ~525px en móvil

**Causa:** reglas Dawn en `base.css` (legacy), no colisión de utilidades: `.share-button__fallback { width: 100%; min-width: max-content; position: absolute; … }`. Con texto largo en el input, el bloque puede superar el viewport si el `<details>` está abierto.

**Acción en #50:** sin editar `component-*` / `base.css`. Harness `main-product-pdp-shell` comprueba `document.documentElement.scrollWidth <= clientWidth + 2` con share **cerrado** (estado por defecto).

## Fuera de alcance (Alpine Migrator / componente)

- Quantity 0×0, `field__input` newsletter, hero artículo, collection-list móvil — otros PRs / CSS de componente.

## Archivos y harness

- `styles/global.css`, `assets/theme.css`, `layout/theme.liquid` (sin compat).
- Harness: `main-product-pdp-shell`, `dawn-flex-grids`, `collection-product-grid`, `featured-collection-slider`, `a-matrix-blocks` (`LEGACY_LAYER=import`).