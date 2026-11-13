# Plan JS corte 2b: controles WC (`plt:*` + Section Rendering)

Pin DS: `@playlovetoys/platform` → `a2c759b` (mismo que 2a).
Estado CSS 2b: **hecho** (`@layer legacy` + `theme.css` en layout; harness `controls` OK).
Estado WC 2b: sort/filtros + drawer sin Alpine (**JS-A/B/C** hechos). Queda **JS-Q\*** (quantity) + staging.

Referencias DS (no editar vendor `plt-*` a mano; solo `sync:plt`):

- Contratos: `node_modules/@playlovetoys/platform/packages/web-components/README.md`
- Tipos collection: `…/src/collection/types.ts`
- Tipos quantity: `…/src/quantity-selector/types.ts`
- Adaptadores Liquid ya sync: `snippets/plt-{sort-select,filter-bar,quantity-selector,pagination}.liquid`

---

## 1. Contrato de eventos `plt:*` (capa theme)

Todos los eventos del DS son `CustomEvent`, `bubbles: true`, `composed: true`. Los de colección
son **cancelables**: si nadie llama `preventDefault()`, el WC hace submit GET / sigue el enlace
(navegación completa). El theme cancela y aplica Section Rendering / Cart API.

| Evento | Emisor | `detail` | Cancelable | Default DS si no se cancela |
|---|---|---|---|---|
| `plt:sort-change` | `<plt-sort-select>` | `{ name, value }` | sí | `form.requestSubmit()` (salvo `manual`) |
| `plt:filter-change` | `<plt-filter-bar>` | `{ values, changed, query }` | sí | submit GET del form |
| `plt:page-change` | `<plt-pagination>` | `{ url, label }` | sí | navegación del `<a>` |
| `plt:quantity-change` | `<plt-quantity-selector>` | `{ value, previousValue }` | no | solo notifica; el input `name` sigue en el form |
| `plt:variant-change` | `<plt-variant-picker>` | ver README | no | fuera de 2b (PDP) |
| `plt:cart-line-change` / `plt:cart-line-remove` | cart line | line ids + qty | — | Fase 3 drawer |
| `plt:cart-drawer-open` / `close` | drawer | — | — | Fase 3 |
| `plt:gallery-change`, `plt:quick-view-*`, `plt:navbar-*` | product/nav | — | — | fuera de 2b |

**Puente theme (patrón único):**

```js
// Pseudocódigo — no implementar hasta el corte que lo use
el.addEventListener('plt:sort-change', (e) => {
  e.preventDefault(); // evita navegación completa
  const url = buildUrlFromFormOrDetail(e);
  fetchSectionAndMorph(url, 'product-grid-container'); // ver §3
});
```

Reglas:

1. Un solo listener por superficie (colección / búsqueda / PDP), no por instancia suelta sin dueño.
2. No mezclar submit nativo del WC **y** Alpine `x-target` en el mismo form.
3. Tras morph, re-inicializar solo lo necesario (hoy Alpine lo hace vía Ajax morph; un puente vanilla debe
   documentar `Alpine.initTree` / re-bind de WCs si el fragmento trae markup nuevo).
4. Fallback sin JS: hijos `data-plt-fallback` del adaptador Liquid (GET completo). No romper eso.

---

## 2. Mapa call sites actuales → objetivo DS

### 2.1 Orden y filtros (Alpine drawer → `plt-sort-select` + `plt-filter-bar`)

| Pieza hoy | Archivo | Comportamiento | Objetivo |
|---|---|---|---|
| Cajón unificado filter+sort | `snippets/facets.liquid` | **JS-C:** `<dialog>` nativo + panel Bulma; cuerpo `plt-filter-bar` + `plt-sort-select`; morph `plt-section-nav` | Hecho (chrome Bulma hasta Fase 3/5) |
| Sort nativo en drawer | `facets.liquid` `<select name="sort_by">` | Mismo form que filtros → morph Alpine | `plt-sort-select` con `options: results.sort_options`, `current: sort_by`, `preserve` = filtros activos + `q` |
| Filtros list/boolean/price | `facets.liquid` + `price-facet.liquid` | Checkboxes / `priceRange()` Alpine | `plt-filter-bar` (`filters: results.filters`, `preserve` sort + `q`) |
| Clear all | link `x-target` a `results_url` | Morph | Chip/clear del filter-bar o link con mismo puente |
| Form vacío sort vertical | `sections/main-collection.liquid` `#FacetSortForm` | `x-target` sin campos (casi no-op) | Eliminar o cablear `plt-sort-select` fuera del drawer **en un corte aparte** |
| Misma facetas | `main-collection-sanity.liquid`, `main-search.liquid` | `render 'facets'` | Mismo snippet; un cambio cubre los tres |
| Sort duplicado en search (Dawn) | `main-search.liquid` (bloque SortBy ~L157) | Revisar si sigue vivo junto al drawer | Inventario en checklist; no dejar dos sorts |

**Por qué no migrar solo `plt-sort-select` “aislado” hoy:** el sort vive **dentro** del mismo form Alpine
que los filtros. Sustituir el `<select>` por el WC sin quitar `x-on:input…requestSubmit` ni sin
`preserve` de filtros provoca doble submit, pérdida de params o morph a medias. No hay call site de
sort fuera del cajón que sea realmente independiente (el `#FacetSortForm` está vacío).

**Corte JS-A recomendado (primer ejecutable de colección):**

1. Extraer puente `plt-section-nav` (nombre tentativo) que escuche `plt:sort-change` /
   `plt:filter-change` / `plt:page-change` en `#main-collection-filters` / search y haga fetch
   `?section_id=` + replace de `#product-grid-container` (mismo id que usa Alpine hoy).
2. En **un** template de prueba (p.ej. solo `main-collection` detrás de flag Liquid o branch),
   reemplazar el `<select sort_by>` del drawer por `plt-sort-select` con `manual: false`, cancelar
   evento, navegar vía puente; **mantener** checkboxes Alpine hasta JS-B.
3. Quitar debounce Alpine **solo** del control migrado (no del form entero si aún hay inputs Alpine).

**Corte JS-B:** `plt-filter-bar` sustituye el loop de filtros + `price-facet`; retirar
`x-on:input.debounce` del form; clear chips DS.

**Corte JS-C (hecho):** drawer `<dialog>` nativo (sin Alpine); bundle WC + `plt-section-nav` en
`layout/theme.liquid`; adapters con `script_url: 'none'`. Chrome Bulma hasta Fase 5.

### 2.2 Cantidad (`quantity-input` → `plt-quantity-selector`)

| Call site | Markup | JS acoplado | Riesgo |
|---|---|---|---|
| `sections/main-product.liquid` | `<quantity-input>` inline + `.quantity__input` + `form="{{ product_form_id }}"` | `QuantityInput` (`global.js`); `product-info.js` lee `.quantity__input`, actualiza min/max/step vía Section Rendering de `Quantity-Form-{{ section.id }}`, pub/sub `quantityUpdate` | **Alto** — no tocar sin adaptar `product-info.js` |
| `sections/featured-product.liquid` | Igual patrón PDP | Mismo | Alto |
| `snippets/quantity-input.liquid` | `name="updates[{{ variant_id }}]"` + cart qty | `quick-order-list.js`, `quick-add-bulk.js` buscan `quantity-input` / `quantity-input input` | Alto — contrato de nombre distinto a `quantity` |
| Cart / line items | Dawn quantity en cart (si aplica) | `cart.js` `resetQuantityInput` | Diferir a Fase 3 con `plt-cart-drawer` |

**Brecha de contrato:**

| Dawn / theme | DS `plt-quantity-selector` |
|---|---|
| CE `<quantity-input>` + botones `.quantity__button` | CE `<plt-quantity-selector>` light DOM |
| Evento nativo `change` en `<input>` | `plt:quantity-change` `{ value, previousValue }` (no cancelable) |
| Selectores `.quantity__input`, `.quantity__button` | Input interno del WC / fallback `data-plt-fallback` |
| `name="quantity"` (PDP) o `updates[id]` (QOL) | `name` prop (default `quantity`) |
| `data-min` / `data-cart-quantity` / pubsub validate | Props `min`/`max`/`step`/`value`; **no** hay pubsub — el theme debe `el.value = …` tras fetch de rules |
| `product-info` reescribe atributos del input en el DOM | Hay que setear propiedades del WC tras morph/partial update |

**Corte JS-Q0 (diseño, sin markup prod):** adaptar o envolver `product-info.js` para hablar con el WC
(leer `value`, escribir props, escuchar `plt:quantity-change` solo si hace falta side-effects). Tests
manuales en harness + PDP staging.

**Corte JS-Q1:** `featured-product` **o** un bloque quantity del PDP detrás de setting — nunca QOL
primero.

**Corte JS-Q2:** `snippets/quantity-input.liquid` / quick-order — requiere `name="updates[…]"` y
listeners de `quick-order-list.js`.

**No hacer en 2b:** cablear quantity en `card-product` / quick-add WC (explícitamente fuera de 2d).

### 2.3 Paginación

Ya migrada en corte **2a** (`plt-pagination` + compact + anchor). El puente Section Rendering de
`plt:page-change` puede reutilizarse en JS-A cuando la colección deje de depender de navegación
completa / Alpine en el grid.

---

## 3. Section Rendering / morph (reemplazo de Alpine Ajax)

Hoy el morph lo hace **Alpine Ajax** (`x-target` → fetch + morph del nodo objetivo), bundle en
`assets/alpine-bundle.js`. Ids observados:

- Contenedor morph: `product-grid-container` / `#product-grid-container`
- Grid interno: `#ProductGridContainer`, `#product-grid` + `data-id="{{ section.id }}"`
- PDP quantity rules: `?variant=&section_id=` → `#Quantity-Form-{{ section.id }}`

Contrato del puente theme:

1. Construir URL absoluta con query del control (`detail.query` del filter, o `sort_by`, o `detail.url`
   de page-change).
2. Añadir `section_id` de la section de colección/búsqueda (desde `data-id` / `data-section`).
3. `fetch` HTML → extraer nodo objetivo → replace/morph.
4. Actualizar `history.pushState` (Alpine Ajax lo hace; el puente debe igualar UX).
5. No cargar el bundle WC dos veces: adaptadores con `script_url: 'none'` si el layout ya carga
   `plt-web-components` (hoy cada snippet puede emitir `<script type="module">`; consolidar en
   layout en el mismo corte que el primer cableado).

---

## 4. Orden de cortes ejecutables (checklist)

### Docs / gates (este PR)

- [x] Documento de contrato `plt:*` + mapas call sites
- [x] Checklist de cortes JS-A → JS-C y JS-Q*
- [x] Actualizar `docs/ds-port-plan.md` (enlace + “siguiente”)

### Antes de tocar Liquid de producción

- [x] Inventario UI (2026-11-13): `main-collection` `#FacetSortForm` estaba **vacío** → call site JS-A.
  `main-search` sigue con sort Dawn residual (`#SortBy` vertical, ~L157) **además** del drawer
  `facets` — no migrar search en JS-A (doble sort a resolver en follow-up).
- [x] Morph target canónico: `#product-grid-container` (mismo id que Alpine `x-target` hoy).
  `#ProductGridContainer` es solo el grid interno.
- [x] Bundle WC: consolidado en `layout/theme.liquid` (JS-C) + `script_url: 'none'` en adapters /
  facets; scripts retirados de `main-collection` / sanity / search.
- [x] Harness: caso `sort-preserve` (sort-only + preserve filters/`q`) además de `controls`.
- [ ] Staging / `shopify theme dev` (Fase 0) para no validar solo harness

### JS-A — sort con puente (primer código)

- [x] Asset puente `assets/plt-section-nav.js` (vanilla; sort/filter/page)
- [x] `plt-sort-select` en `main-collection` (`#FacetSortForm`); cancela `plt:sort-change` vía puente
- [x] Preserve filtros activos + `q` (props del adaptador Liquid)
- [ ] Sin regresión en tienda: clear all, paginación, empty state (requiere staging)
- [x] Gates (2026-11-13): `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline;
  `shopify theme check` = 6 err / 362 warn (≤ baseline)

### JS-B — filter-bar (2026-11-13)

- [x] Reemplazar loop filtros + price-facet en `snippets/facets.liquid` por `plt-filter-bar`
- [x] Sort del drawer → `plt-sort-select` (mismo puente); sin `<form>` exterior (los WC traen el suyo)
- [x] `plt:filter-change` → `plt-section-nav`; sin `x-on:input.debounce` / `x-target` en facets
- [x] `main-collection-sanity` + `main-search`: root `data-plt-section-nav` + scripts; sort Dawn residual de search eliminado
- [x] Harness `filter-bar`
- [ ] Boolean filters: el adapter DS solo mapea `list` + `price_range` (gap upstream)
- [ ] Staging / clear chips / empty state en tienda

### JS-C — retirar Alpine de facets (2026-11-13)

- [x] Drawer → HTML `<dialog>` nativo (Escape + click backdrop; sin `x-data` / `drawerOpen`)
- [x] Sin `x-target` / debounce Alpine en facets (ya desde JS-B)
- [x] Bundle `plt-web-components.bundle.js` + `plt-section-nav.js` en `layout/theme.liquid`
- [x] Archivos Liquid con `x-data` restantes: **12** (meta Fase 5) —
  `blocks/b-carousel`, `sections/{aa-banner-html-copy,aa-hero-toggle-content,collection-list,header,main-cart-footer,main-collection-plt}`,
  `snippets/{card-product,cart-item-b,_collection-hero-collapsable-content,_collection-seo-faqs,predictive-search}`

### JS-Q* — quantity

- [ ] Q0: capa compat `product-info` ↔ WC
- [ ] Q1: un PDP / featured
- [ ] Q2: quick-order / `updates[]`
- [ ] No card-product quantity en 2b

### Explicitamente fuera / bloqueado

- [ ] Migración masiva de `facets.liquid` en un solo PR
- [ ] Editar a mano `snippets/plt-*.liquid` vendor (solo `npm run sync:plt`)
- [ ] `plt-cart-drawer` / cart quantity (Fase 3)
- [ ] `plt-variant-picker` en PDP (corte propio)
- [ ] Fase 0 capturas sin credenciales merchant

---

## 5. Criterio de “2b WC hecho”

1. Colección y búsqueda: sort + filtros via WC; morph sin depender de Alpine Ajax en facets.
2. PDP (y featured si aplica): quantity via WC; `product-info` actualiza rules sin selectores Dawn.
3. QOL/cart quantity: migrados o documentados como follow-up con dueño (Fase 3 / Q2).
4. Gates verdes; harness `controls` + checklist visual tienda.

Hasta entonces, el port plan marca **2b WC** como bloqueado con este documento como desbloqueo de diseño.
