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
| Clases del DS hoy | Tras 2d: `d-*` en divider/breadcrumb/price; `plt-product-card` / `d-card` en `card-product`; `plt-*` de WC aún no cableados en storefront (salvo ids legacy `plt-product-modal` / `plt-gradient-background`) | |
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
- [x] `package.json` con `@playlovetoys/platform` fijado a `PlayLoveToys/PLT-design-system#b0ba294`
  (HEAD del DS al momento; `plt-frontend-liquid` sigue en `648b67b`), `tailwindcss`/`@tailwindcss/cli` 4,
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

**Método (cada corte):** (1) renderizar el snippet real en `tools/snippet-harness` y mirarlo en el navegador
junto al CSS real del theme; (2) solo si se ve bien, migrar y enlazar. Un cambio de apariencia hacia el
look del DS es esperado; lo que se descarta son roturas (layout, texto sin traducir, JS inerte).

`npm run harness:snippet -- <caso>` genera `tools/snippet-harness/.out/<caso>.html`, autocontenido (CSS y
bundle incrustados, porque el panel del navegador lo carga como `data:`). Casos en
`tools/snippet-harness/cases/`.

#### Corte 2a: paginación — **bloqueado upstream, no migrado** (2026-11-12)
Se migró `pagination.liquid` a `<plt-pagination>` y se revisó en el harness. Se **revirtió** por dos motivos:
- **Layout roto para paginación numérica.** El CSS del DS (`.plt-pagination .d-btn { flex: 1 1 14rem }`, pensado
  para paginación de documentación con títulos largos) hace que cada número crezca a 14 rem: se apila en
  móvil y forma una cuadrícula en escritorio. Falta una variante compacta (p. ej. `plt-pagination--compact`
  o un atributo) para números.
- **Sin soporte de `anchor`.** El adaptador no puede añadir un fragmento a sus enlaces (`main-article` lo usa
  para saltar a `#Comments-<id>`).

Pedido al DS en [PlayLoveToys/PLT-design-system#1](https://github.com/PlayLoveToys/PLT-design-system/issues/1)
(publicado 2026-11-12; texto en [`docs/upstream/ds-issue-numeric-pagination.md`](upstream/ds-issue-numeric-pagination.md)): variante
compacta de paginación numérica y parámetro `anchor` en `plt-pagination.liquid`. Al subir el pin, reaplicar:
wrapper `<div class="flex justify-center my-8">`, variables con `assign` antes del `render` (liquidjs no
evalúa filtros en argumentos de `render`), y conservar el markup Bulma solo mientras falte `anchor`.
Fuera del snippet compartido hay paginaciones inline que también migrar: `main-account`, `main-addresses`,
`blog-mansory`.

**Análisis previo al enlace** (sigue siendo válido como contexto): `theme.css` no tiene selectores de
elemento globales sin capa, 0 colisiones de variables con el CSS legacy (246 variables propias) y las
reglas del DS viven en capas. Con legacy **sin** capa, el CSS legacy ganaba siempre en conflicto — eso
protege a la tienda pero **rompe los componentes del DS**. Por eso el enlace real fue con opción A en 2b
(ver abajo), no “a secas”.

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
- Cantidad: el theme usa `<quantity-input>` (`assets/global.js`, ligado a `product-form`) en `main-product`,
  `featured-product` y `quick-order-list-row`. Migrar implica el JS de formulario de producto.
- Orden y filtros: no los maneja ningún `facets.js` (**corrección**: la referencia en `main-search.liquid`
  era una etiqueta obsoleta; **eliminada en higiene 2c**. `<facet-filters-form>` no está definido). Los
  maneja Alpine con `x-target` en el cajón `b-drawer` de `snippets/facets.liquid` (envío automático con
  debounce de 800 ms). Migrar a `plt-filter-bar` / `plt-sort-select` implica reemplazar ese cajón.

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

Fuera de 2c (siguen bloqueados): reaplicar 2a al subir pin DS; cablear 2b WC (eventos `plt:*` + Section
Rendering); capturas Fase 0; Fase 3 shell.

#### Corte 2d: `card-product` → markup ProductCard (estático) — **hecho** (2026-11-12)
Con 2a aún bloqueado ([DS#1](https://github.com/PlayLoveToys/PLT-design-system/issues/1) abierto; pin
`@playlovetoys/platform` sigue en `b0ba294`, sin variante compacta ni `anchor`), el siguiente corte viable
sin WC ni shell es la card de producto **solo markup**:

1. Harness `product-card` (`LEGACY_LAYER=import`) con regular / sale / sold-out / rating / placeholder +
   referencia del renderer DS.
2. `snippets/card-product.liquid` pasa de `b-card` Bulma a la estructura DS
   (`d-card` / `plt-media-card` / `plt-product-card`, badge en body, tipografía `theme-*`). Se conserva el
   wrapper Alpine `productCard({…})` y el nodo de `errorMessage` (quick-add / cart); no se cablea
   `plt-quantity-selector` ni quick-add WC.
3. Higiene: borrado `snippets/card-product-new.liquid` (sin referencias).

**Fuera de 2d (siguen pendientes / bloqueados):**
- Reaplicar 2a (`plt-pagination`) cuando DS#1 aterrice y se suba el pin.
- 2b WC: cantidad / sort / filtros (eventos `plt:*` + Section Rendering / cajón Alpine).
- Badges Dawn residuales en `article-card` / `main-search` (markup blog; no es ProductCard).
- Capturas Fase 0 y Fase 3 shell (requieren tienda).

**Gates (2026-11-12):** `check:plt` ok; `check:theme-css` ok; `test:templates` = baseline (40/42);
`shopify theme check` = **6 errores / 362 avisos** (sin regresión).

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
