# Plan de port: PLT-liquid-theme → PLT-design-system

Destino: `git@github.com:PlayLoveToys/PLT-design-system.git` (paquete `@playlovetoys/platform`).
Decisión de dirección (2026-11-12): **port en este repo**. `plt-frontend-liquid` es el donante
de tooling (`sync-plt`, `check-theme-css`, `validate-template-json`, `styles/global.css`, harness y
specs Playwright), no de sections: solo comparten 18 de 65 sections y 9 de 89 snippets.

> Este repo es **público**: todo lo que se commitee aquí se publica.

## 1. Punto de partida

| Eje | Estado actual | Destino |
|---|---|---|
| Base CSS | Dawn `base.css` (80 KB) + Bulma `b-style.source.css` (650 KB) + 71 `component-*.css`; ~1,26 MB de CSS | daisyUI 5 + Tailwind 4, tokens `--plt-*`, tema `cheesecake` |
| Markup | 492 usos de `b-*` en 52 archivos; `color-{{scheme}}` en 37; `page-width` en 44; 20 archivos con `<style>`; 99 `style=""` inline | renderers Liquid del DS + `d-*` / `theme-*` / `plt-*` |
| JS | Alpine en 14 archivos; loader CDN de Shopify Web Components (desactivado) | Web Components Lit del DS |
| Clases del DS hoy | Tras 2f: `d-*` en divider/breadcrumb/price + badges blog/search/gift_card; `d-btn*` en `snippets/button`; `plt-product-card` / `d-card` en `card-product`; `plt-*` de WC aún no cableados en storefront (salvo ids legacy `plt-product-modal` / `plt-gradient-background`) | |
| Tamaño | 65 sections, 89 snippets, 36 blocks, 47 templates | |

### Baseline de calidad (Fase 0, 2026-11-12, `shopify theme check`, CLI 3.91.0)

7 errores y 354 avisos **previos al port**. No se arreglan como parte del port salvo que toquen el
archivo migrado; sirven para detectar regresiones.

| Check | Cantidad | Nota |
|---|---|---|
| VariableName | 303 | estilo (camelCase vs snake_case) |
| RemoteAsset | 23 | |
| UnusedAssign | 19 | |
| UndefinedObject | 5 | |
| JSONMissingBlock | 3 | bloque de app `forms` en `metaobject/{local_page,location_page,region}.json` |
| DeprecatedFilter / PaginationSize | 2 + 2 | |
| LiquidHTMLSyntaxError | 1 | `sections/after-page-content.liquid:19` cierra un `div` no abierto |
| ImgWidthAndHeight | 1 | `sections/main-bloggle-article.liquid:365` |
| ContentForHeaderModification | 1 | `templates/search.avada-seo.liquid` |
| **MissingAsset** | 1 | ~~`sections/main-search.liquid` → `facets.js`~~ — **resuelto en higiene 2c** (script obsoleto eliminado). Los filtros los maneja Alpine (ver corte 2b). Baseline histórico: 1 MissingAsset previo al port. |

Validación de templates (`npm run test:templates`): **40 de 42** JSON parsean en modo estricto. Fallan
`templates/blog.json` (línea 79) y `templates/page.test.json` (línea 205) por un error de sintaxis JSON
estricta (probablemente coma final). Son datos del merchant y Shopify/theme check los aceptan: no se tocan.
Se registran como baseline del validador.

> Corrección (2026-11-12): una versión anterior de este documento decía "26 JSON parsean". Esa cifra venía
> de ejecutar el script desde `plt-frontend-liquid`, es decir, validaba los templates de *otro* repo.

## 2. Reglas de la migración

1. **No renombrar** ids de settings (`config/settings_schema.json`) ni tipos de section/block:
   `templates/*.json` y `settings_data.json` son datos del merchant.
2. Política upstream del DS: lo compartido se arregla **en el DS** y se sube el pin. Prohibido editar a
   mano `assets/plt-web-components.bundle.js`, `snippets/plt-*.liquid`, `styles/plt/*.css`.
3. Un PR por fase (idealmente por template dentro de la Fase 4); cada uno pasa `theme check` sin
   superar el baseline y su diff visual.
4. Sin lógica Shopify en el DS: los renderers reciben datos ya normalizados (precio formateado, URLs).

## 3. Fases

### Fase 0: Red de seguridad
- [x] Baseline de `theme check` y validación de templates (arriba).
- [ ] Captura visual a 390/768/1280 de: home, colección, producto, carrito, búsqueda, artículo, page,
  404, cuenta. **Bloqueado**: requiere `shopify theme dev` contra una tienda (credenciales del merchant).
  Reutilizar `plt-frontend-liquid/tools/visual-compare`.
- [ ] Fijar handles de fixture (producto, colección, artículo) y guardarlos en este documento.
- [x] `facets.js` ausente: etiqueta obsoleta en `main-search` (ver corte 2b). **Higiene 2c:** `<script>` eliminado.

### Fase 1: Tooling y tokens (sin cambio visual)
**Hecho (2026-11-12), sin tocar `layout/` ni ningún snippet/section existente:**
- [x] `package.json` con `@playlovetoys/platform` fijado a `PlayLoveToys/PLT-design-system#a2c759b`
  (pin subido en corte 2a; antes `b0ba294`), `tailwindcss`/`@tailwindcss/cli` 4,
  `daisyui` 5 (dev). Scripts `build:css`, `watch:css`, `sync:plt`, `check:plt`, `check:theme-css`, `test:templates`.
- [x] `scripts/` copiados de `plt-frontend-liquid`; `.gitignore` y `.shopifyignore` (excluye `node_modules`,
  `docs`, `scripts`, `styles`, `package*.json` de las operaciones de Shopify CLI).
- [x] `styles/global.css` → `assets/theme.css` (128 KB minificado). **Sin preflight de Tailwind**: solo capas
  `theme` + `utilities` y el tema `cheesecake`, para no pisar Dawn/Bulma. Daisy usa prefijo `d-`.
- [x] `sync:plt` vendoriza 10 artefactos: `assets/plt-web-components.bundle.js`, 7 `snippets/plt-*.liquid` y
  `styles/plt/*.css`. `check:plt` y `check:theme-css` pasan.
- [x] `theme check`: 7 errores (igual que el baseline); avisos 354 → 362 (+8 `RemoteAsset`/`UnusedAssign`
  de los snippets vendorizados; no se editan a mano).

**Enlace de `assets/theme.css`:** inicialmente se aplazó (sin capturas Fase 0). **Actualizado (corte 2b,
2026-11-12):** sí está enlazado en `layout/theme.liquid` junto con la opción A (`@layer legacy` + `@import`
de Dawn/Bulma). Ver corte 2b. El adaptador `shopify` del DS (estilos a `body` / `.shopify-section`) sigue
sin importarse a propósito.

Pendiente de la fase:
- Reintroducir preflight de Tailwind cuando se retire Bulma (Fase 5).
- Adaptador `shopify` del DS (alias `--token-*`, fondo de `body`): activar cuando haya consumidores migrados
  y capturas reales.
- **Riesgo central** (sigue abierto): colisiones de nombre (`button`, `card`, `menu`, `modal`) con Dawn/Bulma;
  mitigado por el prefijo `d-`, a confirmar con capturas.
- Mapear `settings_schema` (color_schemes, tipografía, botones, inputs, cards) a tokens. Decisión de
  producto abierta: qué sigue editable por el merchant y qué pasa a fijo.
- Desvíos conocidos del DS vs Liquid `brand`: borde 1.5 px vs 2 px, sombra 2 px vs 4 px.

### Fase 2: Primitivas y controles
`button`→`d-btn`; precio, badges, inputs, alertas, divider, breadcrumb; `card-product`→`product-card`;
cantidad, variantes, paginación, orden, filtros, galería y quick add→Web Components del DS (patrón:
cancelar `plt:*` y aplicar con Section Rendering).

**Higiene (2026-11-12, con corte 2c):** borrados sin referencias —
`snippets/card-product-Respaldo.liquid`, `snippets/price-BK.liquid`, `assets/base-BK.css`,
`assets/base-purged.css`. Script obsoleto a `facets.js` quitado de `sections/main-search.liquid`.
**Higiene 2d:** borrado `snippets/card-product-new.liquid` (sin referencias).
**Higiene 2f:** borrados `snippets/a-dummy-products.liquid` y `snippets/collection-itemlist-schema.liquid`.

**Método (cada corte):** (1) renderizar el snippet real en `tools/snippet-harness` y mirarlo en el navegador
junto al CSS real del theme; (2) solo si se ve bien, migrar y enlazar. Un cambio de apariencia hacia el
look del DS es esperado; lo que se descarta son roturas (layout, texto sin traducir, JS inerte).

`npm run harness:snippet -- <caso>` genera `tools/snippet-harness/.out/<caso>.html`, autocontenido (CSS y
bundle incrustados, porque el panel del navegador lo carga como `data:`). Casos en
`tools/snippet-harness/cases/`.

#### Corte 2a: paginación → `plt-pagination` compact + `anchor` — **hecho** (2026-11-13)
Desbloqueado por [DS#1](https://github.com/PlayLoveToys/PLT-design-system/issues/1) cerrado vía
[PLT-design-system#2](https://github.com/PlayLoveToys/PLT-design-system/pull/2) (`a2c759b` en `main`):

1. Pin `@playlovetoys/platform` → `a2c759b`; `sync:plt` + `build:css` (entra `.plt-pagination--compact`).
2. `snippets/pagination.liquid`: wrapper `flex justify-center my-8`, `compact: true`, propaga `anchor`,
   labels vía `assign` + `render 'plt-pagination'` (liquidjs no evalúa filtros en args de `render`).
3. Inlines → snippet compartido: `main-account`, `main-addresses` (`main-blog-mansory` ya lo usaba).
4. Harness `pagination.mjs`: compact + caso `anchor: '#Comments-123'`.

**Gates (2026-11-13):** `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline;
`shopify theme check` ≤ baseline (6 err / 362 warn).

#### Corte 2b: cantidad, orden y filtros — **bloqueado por la capa de CSS legacy** (2026-11-12)
Caso `controls` del harness (`plt-quantity-selector`, `plt-sort-select`, `plt-filter-bar`), con el CSS real:

| Variante | Resultado |
|---|---|
| Legacy sin capa (como hoy) | **Roto**: botones −/+ de 15 px de ancho con el símbolo recortado, checkboxes como píldoras de 10×24 px |
| Legacy en `@layer legacy` (`LEGACY_LAYER=1`) | **Correcto**: cantidad (con `−` deshabilitado en el mínimo), orden y filtros se ven bien |

Causa: reglas de elemento **sin capa** del legacy ganan a las reglas **en capa** de daisyUI: `button { padding: 0 }`
(Bulma, `b-style.css`) e `input[type="checkbox"] { width: auto }` (Dawn, `base.css`). Es el efecto inverso del
que protege la tienda, y afectará a *cualquier* componente del DS mientras haya reset legacy sin capa.

**Cómo bajar la prioridad del legacy** (el DS no puede arreglarlo: es el orden de capas del consumidor).
No se aceptan overrides locales de CSS del DS (política upstream).

| Opción | Qué es | Pros | Contras |
|---|---|---|---|
| A. `@import` con capa en el layout | Sustituir los `<link>` de `base.css` y `b-style.css` por `<style>@layer legacy, theme, base, components, utilities; @import url('…base.css') layer(legacy); …</style>` | Sin tocar los CSS; reversible | Cadena de peticiones extra, bloquea el render; `@import` solo en `<style>` inline con URL absoluta del CDN |
| B. Envolver los ficheros | Añadir `@layer legacy { … }` en `base.css` y `b-style.css`/`b-style.source.css` (ninguno tiene `@import` ni `@charset`; `b-style` empieza con BOM) | Sin petición extra | Edita artefactos generados: `b-style.css` es salida de Bulma (hay `.map`), se pierde al regenerar |
| C. Migrar por template quitando el legacy | Cargar solo `theme.css` (con preflight) en templates ya migrados | Resultado final limpio | Header/footer son compartidos y siguen en legacy: no es viable hasta migrarlos |

Recomendación: **A** durante la transición (reversible y sin tocar generados), y retirar el legacy en la Fase 5.

**Implementado: opción A (2026-11-12), en `layout/theme.liquid`.** El orden `@layer legacy, theme, base,
components, utilities` se declara antes de `theme.css`; `base.css` y `b-style(.source).css` se cargan con
`@import url(…) layer(legacy)`; `theme.css` queda enlazado. `layout/password.liquid` no se toca (no carga
`theme.css` ni Bulma). Verificado en el harness (`LEGACY_LAYER=import`, misma sintaxis con `data:` URLs): los dos
imports cargan en la capa `legacy`, el DS se ve bien y el markup Bulma sigue estilizado. `theme check` sin cambios
(7 errores / 362 avisos, ninguno en el layout).

**Sin verificar contra la tienda real** (hace falta `shopify theme dev`). Qué mirar ahí:
- Cada `@import` encadena una petición y bloquea el render (2 más que antes); medir LCP/CSS bloqueante.
- Orden de empates: antes `b-style` iba después de los `component-*.css` y ganaba empates de misma especificidad;
  ahora los `component-*.css` (sin capa) ganan a `b-style`. Solo importa en selectores de elemento idénticos.
- El DS fija `background-color`, `color`, `color-scheme` y `scrollbar-gutter` en `html` (ver arriba).
- Los 128 KB de `theme.css` (~20 KB gz) cargan ya en todas las páginas aunque aún no haya componentes migrados.
Efecto colateral medido de bajar el legacy: el DS pasa a fijar sobre `html` (no sobre `body`) `background-color`,
`color`, `color-scheme`, `scrollbar-gutter` y el bloqueo de scroll de daisyUI. Hay que comprobarlo contra una
página real; en el harness el fondo de la página pasó a crema (#FAF7F2).

**Acoplamiento JS que sigue pendiente aunque se resuelva el CSS:**
- Cantidad: el theme usa `<quantity-input>` (`assets/global.js`, ligado a `product-form` /
  `product-info.js`) en `main-product`, `featured-product` y `quick-order-list-row`. Migrar implica el
  JS de formulario de producto.
- Orden y filtros: no los maneja ningún `facets.js` (**corrección**: la referencia en `main-search.liquid`
  era una etiqueta obsoleta; **eliminada en higiene 2c**. `<facet-filters-form>` no está definido). Los
  maneja Alpine con `x-target` en el cajón `b-drawer` de `snippets/facets.liquid` (envío automático con
  debounce de 800 ms). Migrar a `plt-filter-bar` / `plt-sort-select` implica reemplazar ese cajón.

**Plan JS 2b (2026-11-13):** ver [`docs/ds-port-2b-js-plan.md`](./ds-port-2b-js-plan.md) — contrato
`plt:*`, mapa call sites, puente Section Rendering vs Alpine Ajax, cortes JS-A/B/C y JS-Q*, checklist.
**No** migrar facets ni quantity en el PR del plan: no hay call site de `plt-sort-select` aislado seguro
(sort vive dentro del mismo form Alpine que los filtros); quantity está acoplado a `.quantity__input` /
`product-info.js`.

#### Corte 2c: divider → breadcrumb → price/badges en cards — **hecho** (2026-11-12)
Con `theme.css` y `@layer legacy` ya en el layout, se ejecutó el PR de higiene + primitivas Liquid sin JS:

1. **Divider** — harness `divider` + migrados `snippets/divider.liquid` y `blocks/_divider.liquid` a clases DS
   (`d-*` / tokens `--plt-*` o utilidades del theme). Settings del block vía CSS variables locales.
2. **Breadcrumb** — harness `breadcrumb` + migrado `blocks/breadcrumb.liquid` sin renombrar tipo de block ni
   settings ids.
3. **Price + badges en cards** — markup de `snippets/price.liquid` hacia look DS (cards / predictive search).
   **No** se reescribió el bloque `price` de PDP para no romper el contrato con `product-info.js`. No se tocó
   `snippets/price-facet.liquid` (Alpine + facets).

**Gates (2026-11-12):** `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline (40/42; fallan
`blog.json` / `page.test.json`); `shopify theme check` = **6 errores / 362 avisos** (≤ baseline 7/362;
`MissingAsset` de `facets.js` eliminado). Harness regenerado con `LEGACY_LAYER=import` para divider /
breadcrumb / price.

**Checklist tienda (sigue pendiente; hace falta `shopify theme dev`):**
- Fondo `html` crema (#FAF7F2) del DS vs página real.
- LCP / CSS bloqueante por los `@import` en capa legacy.
- Empates de especificidad `component-*.css` (sin capa) vs Bulma en capa `legacy`.

Fuera de 2c (en aquel momento): ~~reaplicar 2a~~ → hecho; cablear 2b WC (eventos `plt:*` + Section
Rendering); capturas Fase 0; Fase 3 shell.

#### Corte 2d: `card-product` → markup ProductCard (estático) — **hecho** (2026-11-12)
Con 2a aún bloqueado en ese momento ([DS#1](https://github.com/PlayLoveToys/PLT-design-system/issues/1);
pin en `b0ba294`), el siguiente corte viable sin WC ni shell fue la card de producto **solo markup**:

1. Harness `product-card` (`LEGACY_LAYER=import`) con regular / sale / sold-out / rating / placeholder +
   referencia del renderer DS.
2. `snippets/card-product.liquid` pasa de `b-card` Bulma a la estructura DS
   (`d-card` / `plt-media-card` / `plt-product-card`, badge en body, tipografía `theme-*`). Se conserva el
   wrapper Alpine `productCard({…})` y el nodo de `errorMessage` (quick-add / cart); no se cablea
   `plt-quantity-selector` ni quick-add WC.
3. Higiene: borrado `snippets/card-product-new.liquid` (sin referencias).

**Fuera de 2d (en aquel momento):**
- ~~Reaplicar 2a (`plt-pagination`)~~ → corte 2a (2026-11-13).
- 2b WC: cantidad / sort / filtros (eventos `plt:*` + Section Rendering / cajón Alpine).
- ~~Badges Dawn residuales en `article-card` / `main-search`~~ → corte 2e.
- Capturas Fase 0 y Fase 3 shell (requieren tienda).

**Gates (2026-11-12):** `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline (40/42);
`shopify theme check` = **6 errores / 362 avisos** (sin regresión).

#### Corte 2e: badges blog/search → `d-badge` — **hecho** (2026-11-12)
Con 2a/2b bloqueados y 2d mergeado, el siguiente corte Liquid-only de bajo acoplamiento:

1. Harness `article-card` (`LEGACY_LAYER=import`) con badge on/off + badge de página (markup
   `main-search`) + referencia `d-badge`.
2. `snippets/article-card.liquid`: `badge color-{{ schemes }}` → `d-badge theme-label-bold` (dos
   ocurrencias del shell Dawn). Se conserva `card__badge` + `settings.badge_position` y el resto del
   markup Dawn (`card` / `article-card`); **no** se migra a EditorialCard (Fase 4).
3. `sections/main-search.liquid`: badge de resultados tipo `page` al mismo patrón.
4. Predictive search: sin leftovers de badges; el precio ya usa `snippets/price.liquid` migrado
   (`show_badges: false`). La shell completa del predictive search queda en Fase 3.

**Fuera de 2e:** ~~`templates/gift_card.liquid`~~ → corte 2f; 2a/2b; Fase 3 shell; card blog
completa → EditorialCard.

**Gates (2026-11-12):** `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline (40/42);
`shopify theme check` = **6 errores / 362 avisos** (sin regresión).

#### Corte 2f: leftovers badge gift_card + button snippet + higiene — **hecho** (2026-11-12)
Último corte Liquid-only de Fase 2 sin WC ni shell, con 2a/2b bloqueados:

1. Harness `button` + `gift-card-badge` (`LEGACY_LAYER=import`).
2. `snippets/button.liquid`: valores de setting `style_class` (`button` / `button-secondary` /
   `link`, ids sin renombrar) → `d-btn d-btn-primary` / `d-btn-outline` / `d-btn-link` +
   `theme-label-bold`. Se quita el `<style>` inline de `.link`. Block `blocks/button.liquid` sin
   cambios de schema.
3. `templates/gift_card.liquid` (`layout none`): enlace de `theme.css` + badge expirado
   `badge badge--expired` → `d-badge theme-label-bold`; `data-theme="brand"` en `body`. Se conserva
   `template-giftcard.css` (sigue ganando a capas del DS en selectores propios).
4. Higiene: borrados sin referencias `snippets/a-dummy-products.liquid` y
   `snippets/collection-itemlist-schema.liquid` (SEO ItemList duplicado; el activo es
   `collection_structured_data.liquid`).

**No limpio / aplazado a propósito:**
- Inputs/alerts masivos (`field__input` / `form__message` / `b-input` / `b-message` / `b-notification`)
  repartidos en login/cuenta/newsletter/footer/contact/article — no hay snippet acotado; newsletter
  y notificaciones van con Fase 3 / forms.
- `_aa-styled-button` (settings Bulma `b_is_*`) y botones Dawn globales (`buy-buttons`, slideshow,
  etc.): migración masiva fuera de alcance.
- Badges Bulma en grids de colección (`b-tag-*` / `b-badge-*` en `main-collection*`) viven dentro del
  shell Bulma de la card → Fase 4 (colección), no un leftover aislado.

**Fuera de 2f (bloqueados entonces):** ~~2a (`plt-pagination` + DS#1)~~ → hecho; 2b WC
(cantidad / sort / filtros + JS); Fase 0 capturas; Fase 3 shell; Fase 5 retirar Bulma/Alpine;
Fase 6 CI gates formales.

**Gates (2026-11-12):** `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline (40/42);
`shopify theme check` = **6 errores / 362 avisos** (sin regresión).

### Estado sesión (2026-11-13)

Fase 2 Liquid-only del port, incluida la paginación desbloqueada por DS#1:

| Hecho | Evidencia |
|---|---|
| Fase 1 tooling + tokens + harness | PR #1 |
| 2b CSS: `@layer legacy` + `theme.css` en layout | commit en PR #1 |
| 2c divider / breadcrumb / price | PR #2 |
| 2d `card-product` markup ProductCard | PR #3 |
| 2e badges article-card / main-search | PR #4 |
| 2f gift_card badge + `snippets/button` + higiene orphans | PR #5 |
| 2a `plt-pagination` compact + `anchor` (pin `a2c759b`) | PR #6 |
| 2b plan JS + **JS-A** puente + sort desktop | PR #7 / #8 |
| 2b **JS-B** `plt-filter-bar` + sort en drawer; search/sanity cableados | PR #9 |
| 2b **JS-Q0** capa compat `product-info` ↔ `plt-quantity-selector` | rama `port/ds-fase-2b-js-q0` / PR #10 |
| 2b **JS-Q1** quantity WC en `featured-product` | rama `port/ds-fase-2b-js-q1` / PR #13 |
| 2b **JS-Q2** quantity WC en QOL / `updates[]` | rama `port/ds-fase-2b-js-q2` |

| Bloqueado | Por qué | Para desbloquear |
|---|---|---|
| **2b WC** resto | Alpine drawer chrome; boolean filters sin adapter DS; `main-product` quantity | **JS-C**; issue DS boolean + pin; PDP quantity follow-up |
| **Fase 0 capturas** | Sin `shopify theme dev` / tienda | Credenciales merchant + handles fixture |
| **Fase 3 shell** | Header/footer/cart/predictive search compartidos; riesgo visual alto | Tienda + capturas; decisión `cart-notification` → `plt-cart-drawer` |
| **Fase 4 sections** | Depende de shell estable y huecos DS (Faq, Carousel, …) | Tras Fase 3 / issues DS |
| **Fase 5 Bulma/Alpine** | Aún hay `b-*` y Alpine en producción | Cuando conteo `b-*` → 0 y WC 2b cableados |
| **Fase 6 CI gates** | Formalizar budgets/diff visual | Tras baseline visual real (Fase 0) |
| **Inputs/alerts / botones globales** | Sin corte Liquid acotado | Por template en Fase 4 o snippet nuevo si se extrae |

**Siguiente (prioridad):** staging de JS-A/B/Q* (filtros/sort/quantity); **JS-C**
(retirar Alpine del drawer / bundle en layout). Sin tienda: Fase 0 capturas y checklist visual
del layout (fondo `html`, LCP `@import` legacy).

### Fase 3: Shell
Header (excepción documentada: se conserva, con `mega-menu.css`), footer + newsletter, carrito
(`cart-notification` → `plt-cart-drawer`: decisión abierta), predictive search.

### Fase 4: Sections por template
Orden: colección/búsqueda → home (`slideshow`, `image-banner`, `multicolumn`) → contenido
(`collapsible-content`/FAQ → `d-collapse`) → blog/artículo → producto (`main-product`, 2354 líneas,
y `featured-product`, 1510) al final. Blocks `b-card-*` → EditorialCard / CollectionCard / ProductCard.
**Se quedan en el theme**: portable-text de Sanity, JSON-LD/SEO, hreflang, metaobjects, `aa-cloudinary-image`,
verificación de edad.

### Fase 5: Retirar legacy
Quitar Bulma cuando el conteo de `b-*` llegue a 0; después Alpine (14 archivos), `component-*.css`,
loader CDN. Revisar `ai_gen_block_*`.

### Fase 6: Gates de CI
`check:plt`, `theme check` (≤ baseline), validación de templates, diff visual, presupuesto de CSS.

## 4. Huecos a implementar primero en el DS
`Faq`, `RichText`, `Carousel`, `TrustBar`, `LinkGrid`, `ChipPills`, `LocationCard`
(`service-area-link-list`, `location_map`), contrato de `MegaMenu`, `MarketSelector`, `Swatch`,
`StickyAddToCart`. Abrir issue en `aavendano/plt-design-system` desde este repo por cada uno.

## 5. Riesgos
- Convivencia de dos CSS: especificidad y peso durante la transición.
- Pérdida de control del merchant al pasar esquemas de color a temas fijos.
- Sin tienda de desarrollo no hay verificación visual real.
- Mantener dos themes Liquid en paralelo a largo plazo (`plt-frontend-liquid` y este).
