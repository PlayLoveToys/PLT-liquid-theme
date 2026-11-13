# Inventario Alpine residual (Fase 5)

Pin DS de referencia: `@playlovetoys/platform` → `a2c759b`.  
Contexto: tras **JS-C** (facets sin Alpine), el plan maestro fija **12** archivos Liquid con `x-data` ([`docs/ds-port-plan.md`](./ds-port-plan.md) § Fase 5; [`docs/ds-port-2b-js-plan.md`](./ds-port-2b-js-plan.md) § JS-C).

**Alcance de este documento:** inventario y clasificación únicamente — **sin migración** de Liquid ni JS.

---

## Verificación con `grep`

Comando: `rg 'x-data' --glob '*.liquid'` (excluyendo `docs/`).

| Resultado | Detalle |
|---|---|
| **Archivos con `x-data`** | **12** — coincide con la lista del plan |
| **Faltantes** | Ninguno |
| **Adicionales con `x-data`** | Ninguno en `.liquid` |

### Alpine sin `x-data` (residual, fuera de los 12)

Estos archivos usan directivas Alpine (`@click`, `x-show`, …) pero **no** declaran `x-data`; dependen de un ancestro o de `Alpine.store`:

| Archivo | Evidencia | Notas |
|---|---|---|
| `snippets/c-carousel-buttons.liquid` | `@click="previous()"` / `next()` | Hijo de `carousel()` en `blocks/b-carousel.liquid` y `sections/collection-list.liquid` |
| `snippets/buy-buttons.liquid` | `@click="$store.cart.add(selectedVariant)"` | Render en `main-product` / `featured-product` **sin** ancestro `x-data` en esas sections — revisar en staging (`selectedVariant` no definido en el snippet) |

No forman parte del conteo de 12; conviene incluirlos en el **mismo programa Fase 5** o en un follow-up de higiene.

### Infraestructura Alpine (no Liquid)

Sigue cargándose en storefront y alimenta varias piezas: `assets/alpine-bundle.js` (plugin `carousel`, `productCard`, Ajax/morph), `assets/cart-store.js` (`Alpine.store('cart')` + `CartApi`), `assets/cart-fragment.js` (`Alpine.initTree` tras morph), `assets/alpine-product-card.js` (duplicado/registro de `productCard`). Retirar Alpine en Liquid **sin** plan para el bundle y el store rompe carrito / cards.

---

## Clasificación

Leyenda:

- **(a)** Chrome migrable a web component del DS o HTML nativo (`<details>`, `<dialog>`, CSS `matchMedia`, etc.).
- **(b)** Lógica acoplada a Shopify Ajax / Cart API / Section Rendering — requiere plan JS propio (como `docs/ds-port-2b-js-plan.md`).
- **(c)** Código muerto u huérfano en este repo: sin `render` / sin section en `templates/*.json` (puede seguir en presets del theme editor).

### Resumen por clase

| Clase | Cantidad | Archivos |
|---|---:|---|
| **(a)** | 5 | `b-carousel`, `aa-hero-toggle-content`, `collection-list`, `_collection-hero-collapsable-content`, `_collection-seo-faqs` |
| **(b)** | 4 | `header`, `main-cart-footer`, `card-product`, `cart-item-b` |
| **(c)** | 3 | `aa-banner-html-copy`, `main-collection-plt`, `predictive-search` |
| **Total** | **12** | |

---

## Tabla de inventario

| archivo | rol Alpine | acción | dependencia | evidencia breve |
|---|---|---|---|---|
| `blocks/b-carousel.liquid` | Componente `carousel()` (autoplay, swipe, prev/next); `x-data` con array placeholder + hijos reales | **(a)** Sustituir por `Carousel` DS ([DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4)) o carrusel nativo con scroll-snap; mantener `c-carousel-buttons` o equivalente | `Alpine.data('carousel')` en `assets/alpine-bundle.js`; botones en `snippets/c-carousel-buttons.liquid` | Block tipo `b-carousel` en `sections/a-matrix.liquid` y `blocks/b-cell.liquid`; usado en `templates/index.json` y metaobjects (`a-matrix`) |
| `sections/aa-banner-html-copy.liquid` | `slideshowSection_*()` inline: slides, dots, flechas, `x-html`, touch | **(c)** Eliminar o archivar tras confirmar con merchant; si se reactiva, **(a)** → `Carousel` DS | Script inline en la section; sin store Ajax | `rg 'aa-banner-html-copy'` en `templates/` → **0**; schema preset `AA-Slideshow-New` solo para theme editor |
| `sections/aa-hero-toggle-content.liquid` | Estado `showContent` + iconos SVG + `x-transition` / `x-if` | **(a)** `d-collapse` / `<details>` + tokens; patrón duplicado en hero colección | Solo UI; contenido estático de settings | En `templates/collection*.json`, `metaobject/local_page.json`, etc. (`"type": "aa-hero-toggle-content"`) |
| `sections/collection-list.liquid` | `carousel({ slides: '.slide-…', intervalTime: 3000 })` | **(a)** Mismo que `b-carousel` | Mismo plugin `carousel` + `c-carousel-buttons` | `collection-list` en home, colecciones, 404, list-collections, metaobjects |
| `sections/header.liquid` | Burbuja contador: `x-data` vacío + `x-show` / `x-text` de `$store.cart.item_count` | **(b)** Sincronizar burbuja vía eventos de `plt-cart-drawer-bridge.js` / pubsub sin `Alpine.store` | `assets/cart-store.js`; bridge en `plt-cart-drawer-bridge.js` | Section global en `layout`; burbuja en `#cart-icon-bubble` |
| `sections/main-cart-footer.liquid` | Contenedor `x-show` si hay ítems; total `x-text` del store; checkout `:disabled` | **(b)** Página `/cart`: reemplazar store por morph/`cart.js` o líneas WC Fase 3 | `$store.cart`, `CartApi`, `refreshCartFragment` | `templates/cart.json` → `main-cart-footer` |
| `sections/main-collection-plt.liquid` | `isMobile` + resize; `@click` abre `#plt-product-modal` con `shopify-context` | **(c)** Decidir producto: retirar section o rehacer colección PLT sin Alpine (layout vía CSS; modal ya es `<dialog>` nativo) | Shopify Storefront Web Components + Alpine mínimo | `rg 'main-collection-plt'` en `templates/` → **0**; solo preset en `config/settings_data.json` |
| `snippets/card-product.liquid` | `productCard({ productUrl, sectionId, productId })`; `x-show` errores quick-add | **(b)** Plan aparte: quick-add / `plt-quick-view` + errores en WC o `product-form` (explícitamente fuera de 2d/2b) | `Alpine.data('productCard')` en bundle + `alpine-product-card.js`; Cart Ajax + `PltCartDrawerHost` | `render 'card-product'` en colección, búsqueda, related-products, PDP, harness |
| `snippets/cart-item-b.liquid` | Estado línea + `decrease`/`increase`/`remove` → `$store.cart.change` | **(b)** Sustituir por `plt-cart-line` / eventos `plt:cart-line-*` (Fase 3) o quantity WC en drawer | `$store.cart`, `CartApi.change`, `x-model` qty | `sections/main-cart-items.liquid` → `cart-item-b` |
| `snippets/_collection-hero-collapsable-content.liquid` | Igual hero toggle: `showContent`, FAQs locales Sanity intro | **(a)** `d-collapse` / `<details>`; alinear con `aa-hero-toggle-content` en un solo snippet | Contenido Sanity vía `_sanity-value` | `main-collection-sanity.liquid` `render '_collection-hero-collapsable-content'` |
| `snippets/_collection-seo-faqs.liquid` | Acordeón por ítem: `open`, iconos, `x-show` | **(a)** `Faq` DS (DS#4) conservando JSON-LD `FAQPage` | Metafields Sanity; sin Ajax | Mismo render desde `main-collection-sanity.liquid` |
| `snippets/predictive-search.liquid` | `Alpine.data('predictiveSearch')` + fetch `search/suggest?section_id=predictive-search` | **(c)** Huérfano hoy; si se cablea al header → **(b)** + issue DS Search (defer Fase 3) | Section Rendering; no usa Dawn `predictive-search` CE | `rg "render 'predictive-search'"` → **0**; header usa `snippets/header-search.liquid` + `predictive-search.js` |

---

## Orden sugerido de migración (un PR por corte)

Prioridad: **bajo riesgo / alto reuse**, luego **carrito unificado**, luego **Ajax pesado** y **limpieza muerta**.

| Orden | PR sugerido | Archivos | Clase | Motivo |
|---:|---|---|---|---|
| 1 | `fase-5-collapse-hero-faq` | `_collection-hero-collapsable-content`, `_collection-seo-faqs`, `aa-hero-toggle-content` | (a) | Misma interacción; sin Cart API; desbloquea Faq DS |
| 2 | `fase-5-carousel` | `collection-list`, `blocks/b-carousel`, `c-carousel-buttons` | (a) | Un plugin Alpine (`carousel`); depende de Carousel DS |
| 3 | `fase-5-cart-store-retire` | `header`, `main-cart-footer`, `cart-item-b` | (b) | Un solo eje: quitar `Alpine.store('cart')` cuando líneas/footer usen drawer/WC |
| 4 | `fase-5-product-card-alpine` | `card-product` (+ `buy-buttons` / `alpine-product-card.js`) | (b) | Ajax add-to-cart + drawer; coordinar con quick-add WC |
| 5 | `fase-5-predictive-search` | `predictive-search` **o** unificar con `header-search` | (c)→(b) | Solo tras decisión shell header; contrato DS pendiente |
| 6 | `fase-5-dead-sections` | `aa-banner-html-copy`, `main-collection-plt` | (c) | Borrado o documentar excepción merchant antes de migrar UI |

**Dependencias cruzadas:**

- No retirar `alpine-bundle.js` hasta que **(b)** cart y **(b)** `card-product` estén migrados.
- `plt-section-nav.js` ya llama `Alpine.initTree` tras morph de colección; al quedar Alpine solo en cards/cart, revisar si ese hook puede eliminarse en un PR posterior.

---

## Gates (baseline documentación, 2026-11-13)

Sin cambios en Liquid/JS/assets vendorizados; mismos resultados que el baseline del port:

| Gate | Resultado |
|---|---|
| `npm run check:plt` | OK — 10 artefactos PLT verificados |
| `npm run check:theme-css` | OK |
| `npm run test:templates` | **40 / 42** (fallan `templates/blog.json`, `templates/page.test.json`) |
| `shopify theme check` (CLI 3.91.0) | **6 errores / 362 avisos** (≤ baseline) |
