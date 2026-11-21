# Inventario Alpine residual (Fase 5) — Completado / Archivado

> **Estado (2026-11-21): COMPLETADO Y ARCHIVADO en `dev-ai` @ `7e7891f`.**  
> Todos los archivos Liquid con `x-data`, directivas Alpine y bundles de runtime (`assets/alpine-bundle.js`, `assets/cart-store.js`, `assets/alpine-product-card.js`) fueron **retirados** (integrado en `dev-ai` vía [PR #41](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/41) y PRs asociados #29, #30, #37, #38).  
> La regresión queda bloqueada en CI por `npm run check:no-legacy` (con `LEGACY_ENFORCE_BULMA=1` en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

Pin DS de referencia en `dev-ai`: `@playlovetoys/platform` → **`bad8290`** ([DS#18](https://github.com/PlayLoveToys/PLT-design-system/pull/18); tracker [DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4) **cerrado**). Referencia histórica en producción `main` @ `f6c4705` (PR #26); `stage` @ `1800d42` (PR #47). Ver plan maestro en [`docs/ds-port-plan.md`](./ds-port-plan.md).

**Alcance de este documento:** registro histórico del inventario Alpine de Fase 5 y verificación de cierre (**0 hits de `x-data`** en `dev-ai`).

---

## Verificación actual (`dev-ai` @ `7e7891f`, 2026-11-21)

Comando: `grep -rn "x-data" sections/ snippets/ layout/ templates/ assets/ blocks/` (excluyendo `docs/`).

| Resultado | Detalle |
|---|---|
| **Archivos con `x-data`** | **0** (eran 12 tras JS-C; 9 tras higiene **(c)** 2026-11-15) |
| **Directivas Alpine en `.liquid`** | **0** — verificadas por `check:no-legacy` (`x-data`, `x-init`, `x-show`, `x-text`, `x-cloak`, `x-model`, `x-bind:`, `x-on:`, `Alpine.data`) |
| **Store / runtime JS** | **0** — `Alpine.store`, `$store`, `alpine-bundle.js`, `cart-store.js`, `alpine-product-card.js` eliminados y bloqueados por `check:no-legacy` |
| **Bulma asociado** | **0** — `b-style.css`, `b-style.source.css` y clases `b-*` eliminados y bloqueados por `check:no-legacy` (`LEGACY_ENFORCE_BULMA=1`) |

### Infraestructura Alpine retirada (no Liquid)

Todos los artefactos de runtime fueron eliminados del repo y están en la lista `RETIRED_ASSET_FILENAMES` de `scripts/check-no-legacy.mjs` (además se bloquea cualquier carga de Alpine por CDN en `layout/theme.liquid`):

- `assets/alpine-bundle.js` — **eliminado**
- `assets/cart-store.js` — **eliminado**
- `assets/alpine-product-card.js` — **eliminado**

### Código muerto retirado en higiene **(c)** (2026-11-15)

Verificación previa: `rg` en `templates/*.json`, `sections/*.json`, `layout/`, `render`, `asset_url` y `config/`.

| Eliminado | Motivo |
|---|---|
| `sections/aa-banner-html-copy.liquid` | Sin `"type": "aa-banner-html-copy"` en templates; preset `AA-Slideshow-New` solo en schema de la section |
| `sections/main-collection-plt.liquid` | Sin template; entrada huérfana en `config/settings_data.json` → `current.sections` (eliminada en el mismo PR) |
| `snippets/predictive-search.liquid` | Sin `render 'predictive-search'`; shell Alpine alternativo nunca cableado |

**Nota sobre predictive search (Dawn, no Alpine):** se conserva `sections/predictive-search.liquid` (Section Rendering vía `section_id=predictive-search`), `assets/predictive-search.js` (`<predictive-search>` CE), `assets/component-predictive-search.css` y `snippets/header-search.liquid` hasta que se implemente el contrato upstream en [DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20).

### Alpine sin `x-data` (residual, fuera de los 12) — Retirado

| Archivo | Estado | Notas |
|---|---|---|
| `snippets/c-carousel-buttons.liquid` | **Migrado / sin Alpine** | Migrado junto con los carruseles (`b-carousel` y `collection-list`) sin `@click="previous()"` / `next()` Alpine |
| `snippets/buy-buttons.liquid` | **Retirado** ([PR #25](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/25)) | Residual `@click="$store.cart.add(selectedVariant)"` / `:disabled` eliminado; ATC del PDP en `<product-form>` / `assets/product-form.js` → `plt-cart-drawer` |

---

## Clasificación histórica y cierre

Leyenda histórica:

- **(a)** Chrome migrable a web component del DS o HTML nativo (`<details>`, `<dialog>`, CSS `matchMedia`, etc.).
- **(b)** Lógica acoplada a Shopify Ajax / Cart API / Section Rendering — plan JS propio (ver `docs/ds-port-2b-js-plan.md`).
- **(c)** Código muerto u huérfano en este repo: sin `render` / sin section en `templates/*.json`.

### Resumen de cierre por clase

| Clase | Inventario inicial | Restantes en `dev-ai` | Archivos cerrados |
|---|---:|---:|---|
| **(a)** | 5 | **0** | `b-carousel`, `aa-hero-toggle-content`, `collection-list`, `_collection-hero-collapsable-content`, `_collection-seo-faqs` |
| **(b)** | 4 | **0** | `header`, `main-cart-footer`, `card-product`, `cart-item-b` |
| **(c)** | 3 | **0** | `aa-banner-html-copy`, `main-collection-plt`, `snippets/predictive-search` (higiene 2026-11-15) |
| **Total** | **12** | **0** | **100 % retirado** (enforced en CI) |

---

## Tabla histórica de inventario (todos cerrados en `dev-ai`)

| Archivo | Rol Alpine original | Clase | Estado en `dev-ai` (`7e7891f`) | Notas / seguimiento |
|---|---|---|---|---|
| `blocks/b-carousel.liquid` | Componente `carousel()` (autoplay, swipe, prev/next) | (a) | **Migrado** | Carrusel sin Alpine ni Bulma (PR #30 → #41); `DS#4` cerrado en `bad8290` |
| `sections/aa-hero-toggle-content.liquid` | Estado `showContent` + iconos SVG + `x-transition` / `x-if` | (a) | **Migrado** | Disclosure nativo/Tailwind sin Alpine (PR #29 → #41) |
| `sections/collection-list.liquid` | `carousel({ slides: '.slide-…', intervalTime: 3000 })` | (a) | **Migrado** | Carrusel sin Alpine ni Bulma (PR #30 → #41, ajustes móvil en #49/#53) |
| `sections/header.liquid` | Burbuja contador con Alpine | (b) | **Migrado** | `data-header-cart-count` + `header-cart-bubble.js` escuchando `plt:cart-updated` (bridge) + respaldo Dawn `cartUpdate`; adopción futura `plt-navbar` (`1ad8166`) |
| `sections/main-cart-footer.liquid` | Contenedor `x-show`, total `x-text`, checkout `:disabled` | (b) | **Migrado** | Retirado `$store.cart` / `CartApi` (PR #38 → #41) |
| `snippets/card-product.liquid` | `productCard({ productUrl, sectionId, productId })` + `x-show` errores | (b) | **Migrado** | Quick-add sin Alpine (`alpine-product-card.js` eliminado; PR #37 → #41); `plt-quick-view` en [DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22) |
| `snippets/cart-item-b.liquid` | Estado línea + `decrease`/`increase`/`remove` → `$store.cart.change` | (b) | **Migrado** | Retirado `$store.cart` (PR #38 → #41); `plt-cart-line` futuro en [DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22) |
| `snippets/_collection-hero-collapsable-content.liquid` | Hero toggle `showContent` (Sanity intro) | (a) | **Migrado** | Disclosure nativo/Tailwind sin Alpine (PR #29 → #41) |
| `snippets/_collection-seo-faqs.liquid` | Acordeón por ítem (`open`, `x-show`) | (a) | **Migrado** | Disclosure nativo/Tailwind sin Alpine conservando JSON-LD `FAQPage` (PR #29 → #41) |

---

## Cortes ejecutados (registro histórico)

| Orden | Corte | Archivos | Estado |
|---:|---|---|---|
| — | `fase-5-dead-sections` | `aa-banner-html-copy`, `main-collection-plt`, snippet Alpine `predictive-search` | **Hecho** (2026-11-15) |
| 1 | `fase-5-collapse-hero-faq` | `_collection-hero-collapsable-content`, `_collection-seo-faqs`, `aa-hero-toggle-content` | **Hecho** (PR #29 → #41) |
| 2 | `fase-5-carousel` | `collection-list`, `blocks/b-carousel`, `c-carousel-buttons` | **Hecho** (PR #30 → #41) |
| 3 | `fase-5-cart-store-retire` | `header`, `main-cart-footer`, `cart-item-b`, `cart-store.js`, `alpine-bundle.js` | **Hecho** (PR #38 → #41) |
| 4 | `fase-5-product-card-alpine` | `card-product`, `buy-buttons` (#25), `alpine-product-card.js` | **Hecho** (PR #37 → #41) |
| 5 | Predictive search DS (fuera de Alpine) | `header-search` + `sections/predictive-search.liquid` (Dawn) | **Seguimiento upstream** en [DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20) |

---

## Gates en CI (`.github/workflows/ci.yml`, 2026-11-21)

La no-regresión de Alpine y Bulma queda garantizada automáticamente en cada PR y push a `dev-ai`, `stage` y `main` (9 gates, 41 casos de harness):

| Gate | Función relevante |
|---|---|
| `npm run check:no-legacy` (`LEGACY_ENFORCE_BULMA=1`) | Bloquea `alpine-bundle.js`, `cart-store.js`, `alpine-product-card.js`, `b-style*.css`, cualquier `x-data`/directiva Alpine, `Alpine.store`/`$store`, CDN Alpine y clases Bulma `b-*` |
| `npm run check:theme-check` | Techo ≤ **6 errores / 362 avisos** (Shopify CLI 3.91.0) |
| `npm run check:plt` / `check:theme-css` / `check:theme-schemas` / `check:tailwind-arbitrary` | Integridad de artefactos DS, CSS, schemas y utilidades Tailwind |
| `npm run test:templates:ci` | Allowlist baseline **40 / 42** |
| `npm run test:harness` | **41 casos** de harness + checks Playwright |
| `npm run check:branch-flow` | Flujo `dev-ai` → `stage` → `main` en PRs |
