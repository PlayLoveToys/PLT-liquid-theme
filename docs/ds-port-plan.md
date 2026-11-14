# Plan de port: PLT-liquid-theme → PLT-design-system

Destino: `git@github.com:PlayLoveToys/PLT-design-system.git` (paquete `@playlovetoys/platform`).
Decisión de dirección (2026-11-12): **port en este repo**. `plt-frontend-liquid` es el donante
de tooling (`sync-plt`, `check-theme-css`, `validate-template-json`, `styles/global.css`, harness y
specs Playwright), no de sections: solo comparten 18 de 65 sections y 9 de 89 snippets.

> Este repo es **público**: todo lo que se commitee aquí se publica.

**Última actualización:** 2026-11-14, sobre `main` @ `326b3c4` (desde `497a933` solo cambió documentación). Medido ese día:
`theme check` 6 errores / 362 avisos; `check:plt`, `check:theme-css` y `test:templates` (40/42) en baseline; 7 snippets
`plt-*` vendorizados.

## 1. Punto de partida

| Eje | Estado actual | Destino |
|---|---|---|
| Base CSS | Dawn `base.css` (80 KB) + Bulma `b-style.source.css` (650 KB) + 71 `component-*.css`; ~1,26 MB de CSS | daisyUI 5 + Tailwind 4, tokens `--plt-*`, tema `cheesecake` |
| Markup | 411 usos de `b-*` en 48 archivos (2026-11-14; eran 492 / 52); `color-{{scheme}}` en 37; `page-width` en 44; 20 archivos con `<style>`; 99 `style=""` inline | renderers Liquid del DS + `d-*` / `theme-*` / `plt-*` |
| JS | Alpine `x-data` en 12 archivos (eran 14; [inventario](./ds-port-alpine-inventory.md)); loader CDN de Shopify Web Components (desactivado) | Web Components Lit del DS |
| Clases del DS hoy | Tras 2f: `d-*` en divider/breadcrumb/price + badges blog/search/gift_card; `d-btn*` en `snippets/button`; `plt-product-card` / `d-card` en `card-product`; `plt-*` de WC aún no cableados en storefront (salvo ids legacy `plt-product-modal` / `plt-gradient-background`) | |
| Tamaño | 65 sections, 89 snippets, 36 blocks, 47 templates | |

### Baseline de calidad (`shopify theme check`, CLI 3.91.0)

| Momento | Errores | Avisos | Nota |
|---|---:|---:|---|
| **Histórico pre-port** (Fase 0, 2026-11-12) | 7 | 354 | Snapshot del theme antes de tooling DS / cortes 2* |
| **Baseline vigente en `main`** (2026-11-13) | **6** | **362** | Techo para todo PR: `MissingAsset` (`facets.js`) resuelto en higiene 2c; +8 avisos por snippets vendorizados tras `sync:plt` |

Los recuentos **históricos 7 / 354** no se mezclan con el baseline operativo **6 / 362**. No se arreglan
como parte del port salvo que toquen el archivo migrado; sirven para detectar regresiones.

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
   superar el baseline vigente (**6 errores / 362 avisos**, CLI 3.91.0) y su diff visual. Sin CI en
   el repo: gates manuales locales (§ Fase 6).
4. Sin lógica Shopify en el DS: los renderers reciben datos ya normalizados (precio formateado, URLs).

## 3. Fases

### Fase 0: Red de seguridad

**Estado (2026-11-13):** artefacto documentable listo para ejecutar cuando haya tienda.
Las **capturas reales siguen pendientes**: ya hay tienda de desarrollo y handles (ver «Tienda y handles
fixture»); falta el login de Shopify del usuario y la descarga de Chromium para Playwright.
No bloquea cortes 2b WC (JS-C / JS-Q*) ni PRs de código.

- [x] Baseline de `theme check` y validación de templates (arriba).
- [x] Artefacto Fase 0: checklist páginas/viewports, placeholders de handles, instrucciones
  `visual-compare`, checklist layout (esta sección).
- [ ] Capturas reales 390 / 768 / 1280 (bloqueado: tienda).
- [ ] Sustituir placeholders de handles por valores reales del merchant y archivar PNGs/baseline.
- [x] `facets.js` ausente: etiqueta obsoleta en `main-search` (ver corte 2b). **Higiene 2c:** `<script>` eliminado.

#### Checklist de capturas (páginas × viewports)

Viewports fijos del port: **390**, **768**, **1280** (ancho CSS; altura fold ~844 móvil / ~900 desktop).

| Página | Ruta (plantilla) | Viewports | Notas |
|---|---|---|---|
| Home | `/` | 390, 768, 1280 | hero, header, footer |
| Colección | `/collections/COLLECTION_HANDLE` | 390, 768, 1280 | grid + facets/sort/paginación |
| Producto | `/products/PRODUCT_HANDLE` | 390, 768, 1280 | galería, precio, quantity, ATC |
| Carrito | `/cart` | 390, 768, 1280 | drawer vs página según estado |
| Búsqueda | `/search?q=` (query con resultados) | 390, 768, 1280 | mismos controles que colección |
| Artículo | `/blogs/<blog>/ARTICLE_HANDLE` | 390, 768, 1280 | badge/card blog |
| Page | `/pages/<page>` (contenido CMS) | 390, 768, 1280 | una page estable del merchant |
| 404 | URL inexistente | 390, 768, 1280 | |
| Cuenta | `/account` (login o cuenta) | 390, 768, 1280 | sin PII en capturas |

Por cada celda: guardar al menos `fold.png` + `full.png`. En colección/búsqueda, además crops de
header / filters / sort / card / grid / pagination / footer si el runner los produce.

#### Tienda y handles fixture (2026-11-14)

Tienda **de desarrollo** (no producción), facilitada por el usuario. No usar la tienda viva para capturas.
`theme dev` sube un tema de desarrollo no publicado y no toca el tema live.

```text
STORE=aadigital-dev-00.myshopify.com
PRODUCT_HANDLE=the-inventory-not-tracked-snowboard
COLLECTION_HANDLE=frontpage
ARTICLE=news/lorem-ipsum          # blog handle / article handle  → /blogs/news/lorem-ipsum
PAGE_HANDLE=contact               # → /pages/contact
SEARCH_QUERY=snowboard            # PROPUESTA (no facilitada): derivada del producto; confirmar que devuelve resultados
```

**Cobertura de estos fixtures: a verificar en el primer `theme dev`.** Parecen datos de muestra de Shopify, y
puede que no ejerciten todo lo que el port ha tocado:

| Qué cubre el port | Posible hueco con estos fixtures |
|---|---|
| Paginación `plt-pagination` compact (corte 2a) | `frontpage` necesita **más de una página** (el theme pagina de 20 en 20); con pocos productos no hay paginación |
| `plt-filter-bar` / sort (JS-A/B/C) | La colección necesita **filtros** con varios valores y, si es posible, un filtro de precio |
| `plt-quantity-selector` y reglas de cantidad (JS-Q*) | «Inventory not tracked» sugiere un producto simple; **sin variantes, reglas de cantidad ni estados de stock** |
| Variant picker, galería | Un producto con varias variantes y varias imágenes |
| Búsqueda | `SEARCH_QUERY` sin confirmar |

Si faltan, añadir en la tienda de desarrollo un segundo producto (con variantes y reglas de cantidad) y una
colección con >20 productos, y registrar aquí sus handles. Citar los handles en el PR de baseline visual (Fase 6).

#### Cómo capturar con `visual-compare` (desde `plt-frontend-liquid`)

El runner vive en el donante de tooling, no en este repo:
`../plt-frontend-liquid/tools/visual-compare/capture.mjs`. Necesita Playwright (`plt-frontend-liquid` lo tiene)
y un Chromium (`npx playwright install chromium`, descarga ~150 MB).

**Qué comparar.** El port ya está mergeado en `main`, así que el baseline útil es **pre-port vs actual**:

| Rol | Código | Puerto |
|---|---|---|
| `--reference` (antes) | commit `f5446a9` (`init`, theme sin tocar), en un `git worktree` | 9292 |
| `--candidate` (ahora) | `main` (este checkout) | 9293 |

```bash
# 0. Una vez: login de Shopify (interactivo, lo hace el usuario)
shopify auth login   # o dejar que el primer `shopify theme dev --store …` pida el login

# 1. Worktree con el theme pre-port (fuera del repo)
git worktree add ../PLT-liquid-theme-preport f5446a9

# 2. Referencia (pre-port)  [terminal A, dejar corriendo]
cd ../PLT-liquid-theme-preport
shopify theme dev --store aadigital-dev-00.myshopify.com --port 9292

# 3. Candidato (main)       [terminal B]
cd ../PLT-liquid-theme
shopify theme dev --store aadigital-dev-00.myshopify.com --port 9293

# 4. Captura por página (desde plt-frontend-liquid, que tiene playwright)
cd ../plt-frontend-liquid
node tools/visual-compare/capture.mjs \
  --reference "http://127.0.0.1:9292/collections/frontpage" \
  --candidate "http://127.0.0.1:9293/collections/frontpage" \
  --widths 390,768,1280 \
  --out ../PLT-liquid-theme/docs/visual-baseline/fase-0/collection
```

Repetir el paso 4 con: `/` (home), `/products/the-inventory-not-tracked-snowboard`, `/cart`,
`/search?q=snowboard`, `/blogs/news/lorem-ipsum`, `/pages/contact`, una URL inexistente (404) y `/account`.

**Precauciones**
- **Posible conflicto entre los dos `theme dev`:** la CLI crea un tema de desarrollo por usuario y tienda, y
  los dos procesos probablemente apuntan al mismo. Si las capturas salen mezcladas, ejecutarlos **de uno en
  uno**: captura primero la referencia, páralo, y luego el candidato.
- El `home` cambió fuera del port: 4 «Update from Shopify» (2026-11-13) tocaron `templates/index.json`
  (contenido del editor). Parte de las diferencias de la home serán de contenido, no del port; el worktree
  pre-port tiene el `index.json` antiguo. Para aislar el efecto del port, copiar el `index.json` actual al
  worktree antes de capturar.
- `capture.mjs` usa por defecto `1440,1024,390`: **pasar siempre** `--widths 390,768,1280`.
- No commitear PNGs voluminosos (ver Fase 6); archivar `docs/visual-baseline/` solo con capturas reales.
- Salida por run: `<out>/<site>/<width>/{fold,full}.png`, `parts/*.png`, `styles.json`, `diff.json`,
  `compare.html`, `summary.json`.

#### Checklist layout (sin captura completa, mirar en DevTools / Lighthouse)

Al primer `shopify theme dev`, antes o junto a las capturas:

- [ ] Fondo `html` crema del DS (`#FAF7F2` / tokens `cheesecake`) vs página real; no forzar
  overrides locales del vendor.
- [ ] LCP / CSS bloqueante: los `@import … layer(legacy)` de `base.css` y `b-style*.css` en
  `layout/theme.liquid` añaden cadena de peticiones; medir frente al baseline pre-2b.
- [ ] Empates CSS: `component-*.css` (sin capa) ganan a Bulma en capa `legacy` en selectores de
  elemento idénticos; anotar regresiones visibles (botones, inputs, cards Dawn).
- [ ] Confirmar que `theme.css` carga en todas las páginas del layout principal (no en
  `password.liquid` / gift card según alcance documentado).

### Fase 1: Tooling y tokens (sin cambio visual)
**Hecho (2026-11-12), sin tocar `layout/` ni ningún snippet/section existente:**
- [x] `package.json` con `@playlovetoys/platform` fijado a `PlayLoveToys/PLT-design-system#a2c759b`
  (pin subido en corte 2a; antes `b0ba294`). **Pin pendiente de subir a `c27304c`** tras merge de
  [PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17) (boolean filters / DS#5).
  `tailwindcss`/`@tailwindcss/cli` 4,
  `daisyui` 5 (dev). Scripts `build:css`, `watch:css`, `sync:plt`, `check:plt`, `check:theme-css`, `test:templates`.
- [x] `scripts/` copiados de `plt-frontend-liquid`; `.gitignore` y `.shopifyignore` (excluye `node_modules`,
  `docs`, `scripts`, `styles`, `package*.json` de las operaciones de Shopify CLI).
- [x] `styles/global.css` → `assets/theme.css` (128 KB minificado). **Sin preflight de Tailwind**: solo capas
  `theme` + `utilities` y el tema `cheesecake`, para no pisar Dawn/Bulma. Daisy usa prefijo `d-`.
- [x] `sync:plt` vendoriza 10 artefactos: `assets/plt-web-components.bundle.js`, 7 `snippets/plt-*.liquid` y
  `styles/plt/*.css`. `check:plt` y `check:theme-css` pasan.
- [x] `theme check`: de 7/354 (histórico pre-port) a **6/362** (baseline vigente; ver tabla §1).

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

#### Corte 2b: cantidad, orden y filtros — **CSS resuelto (opción A); JS-A/B/C/Q0–Q2 hechos** (bloqueo inicial: 2026-11-12)
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
(6 errores / 362 avisos, ninguno en el layout).

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
  ~~manejaba Alpine con `x-target` en el cajón~~ → **JS-A/B/C:** `plt-sort-select` + `plt-filter-bar` +
  puente `plt-section-nav`; drawer chrome = `<dialog>` nativo (sin Alpine).

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
`blog.json` / `page.test.json`); `shopify theme check` = **6 errores / 362 avisos** (baseline vigente;
histórico pre-port 7/354; `MissingAsset` de `facets.js` eliminado). Harness regenerado con `LEGACY_LAYER=import` para divider /
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

Una fila por ítem; sin duplicados. PRs abiertos se tratan como **en revisión** (no mergeados).

| Estado | Ítem | Evidencia / enlace |
|---|---|---|
| **Hecho** | Fase 1 tooling + tokens + harness | [PR #1](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/1) |
| **Hecho** | 2b CSS: `@layer legacy` + `theme.css` en layout | commit en PR #1 |
| **Hecho** | Cortes 2c–2f (divider, breadcrumb, price, card, badges, gift_card, button) | [PR #2](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/2)–[#5](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/5) |
| **Hecho** | 2a `plt-pagination` compact + `anchor` (pin `a2c759b`) | [PR #6](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/6) |
| **Hecho** | 2b JS-A/B plan + puente Section Rendering + sort desktop | [PR #7](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/7) / [#8](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/8) |
| **Hecho** | 2b JS-B `plt-filter-bar` + sort en drawer | [PR #9](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/9) |
| **Hecho** | 2b JS-C drawer `<dialog>` + bundle WC en layout | [PR #12](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/12) |
| **Hecho** | 2b JS-Q0 `product-info` ↔ `plt-quantity-selector` | [PR #10](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/10) |
| **Hecho** | 2b **JS-Q1** quantity WC en `featured-product` | [PR #13](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/13) **cerrado sin merge**; código en `main` vía [PR #15](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/15) (JS-Q2), commit [`9377a75`](https://github.com/PlayLoveToys/PLT-liquid-theme/commit/9377a7539478f8ba5f088a48047d6121211ef330) |
| **Hecho** | 2b JS-Q2 quantity en QOL / `updates[]` | [PR #15](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/15) |
| **Hecho** | Fase 0 artefacto docs (checklist capturas; sin PNGs) | [PR #14](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/14) |
| **En revisión** | 2b **JS-Q3** quantity WC en `main-product` | [PR #16](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/16) |
| **En revisión** | 2b boolean filters: pin `c27304c` + `sync:plt` | [PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17) (listo para review; [DS#5](https://github.com/PlayLoveToys/PLT-design-system/pull/5) ya en DS `main`) |
| **En revisión** | Inventario Alpine residual (Fase 5) | [PR #18](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/18) → [`docs/ds-port-alpine-inventory.md`](./ds-port-alpine-inventory.md) (aún no en `main`) |
| **Pendiente** | Fase 0 capturas reales 390/768/1280 | Tienda de desarrollo y handles ya definidos (§ Fase 0); falta `shopify auth login` del usuario y Chromium; pre-port `f5446a9` vs `main` |
| **Pendiente** | Fase 3 shell (header tokens, predictive search, newsletter) | Tras aclarar cart (abajo) + capturas |
| **Pendiente** | Fase 4 sections por template | Orden § Fase 4; Alpine plegado según inventario |
| **Pendiente** | Fase 5 retirar Bulma → luego Alpine | Ver § Fase 5 + inventario Alpine |
| **Pendiente** | Fase 6 gates formales en CI | No hay GitHub Actions; ver § Fase 6 |
| **Dudoso / perdido** | Fase 3 cart drawer | Plan citaba rama `port/ds-fase-3-shell-cart` (**no existe** en GitHub; **ningún PR**). En `main` sí hay `snippets/cart-drawer.liquid` + `assets/plt-cart-drawer-bridge.js` (commit [`c57ea14`](https://github.com/PlayLoveToys/PLT-liquid-theme/commit/c57ea1426e33e3e6d73c0201392125fcd192a0b9), sin PR). **Investigación aparte** para procedencia y si el corte está completo |
| **Bloqueado** | Carruseles Alpine (`b-carousel`, `collection-list`, `c-carousel-buttons`) | No hay componente **Carousel** en DS — [DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4) |
| **Bloqueado** | FAQ colección (`_collection-seo-faqs`) → `d-collapse` / Faq DS | No hay componente **Faq** en DS — [DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4) |
| **Bloqueado** | Smoke PDP / layout en tienda | Depende del login de Shopify del usuario; los fixtures pueden no cubrir paginación, filtros ni quantity rules (§ Fase 0) |
| **Bloqueado** | Inputs/alerts / botones Dawn globales masivos | Sin snippet acotado; por template Fase 4 |

**Siguiente (prioridad):** merge/review [PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17) (pin) y [PR #16](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/16) (JS-Q3);
staging en tienda de filtros boolean, quantity PDP y drawer cart; aclarar estado Fase 3 cart (`c57ea14`);
verificar en staging `snippets/buy-buttons.liquid`: `@click="$store.cart.add(selectedVariant)"` **sin** ancestro `x-data` en PDP (`main-product` / `featured-product`). Alpine residual: **12** archivos con `x-data` ([inventario](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/18)). Gates: locales (`check:plt`, `check:theme-css`, `test:templates`, `theme check` ≤ **6/362**).

### Fase 3: Shell

**Cart — estado dudoso / perdido (2026-11-13):** el plan asumía el corte en la rama
`port/ds-fase-3-shell-cart`, que **no existe** en GitHub y **ningún PR** la referencia. Aun así,
en `main` están `snippets/cart-drawer.liquid` y `assets/plt-cart-drawer-bridge.js` (commit
`c57ea14`, autorefactors de `product-form.js` / `quick-add.js` / Alpine card). Falta confirmar si
eso equivale al corte shell-cart completo o a un commit huérfano (investigación en curso).

Intención documentada del corte cart (cuando se cierre el estado):

- `cart-notification` → `plt-cart-drawer`; call sites: `product-form.js`, `quick-add.js`, Alpine
  product card / bundle; bridge en `#cart-icon-bubble`; bundle WC en layout (JS-C).
- Coordinar con Alpine **(b)** del inventario: `header` (burbuja), `main-cart-footer`, `cart-item-b`
  y quick-add en `card-product` (ver § Fase 4 colección / § Fase 5).

- **Footer + newsletter (parcial en `main`):** tokens `theme-label-bold` / `d-input` / `d-btn*`
  sin renombrar settings merchant.
- **Predictive search (defer):** sin contrato DS; mínimo `theme-label-bold` en headings; revisar con
  header o issue DS Search.
- **Header (pendiente `fase-3-header`):** conservar estructura + `mega-menu.css`; solo tokens/`d-*`
  donde no rompa mega-menu.

### Fase 4: Sections por template

Orden de migración Liquid (+ Alpine residual del inventario en el mismo orden de página):

1. **Colección / búsqueda** — grids Bulma → cards DS; facets ya WC (2b). Alpine: `card-product`
   quick-add (**(b)**, acoplado a Fase 3 cart / `plt-cart-drawer-bridge.js`), hero
   `_collection-hero-collapsable-content` **(a)** collapse.
2. **Home** — `slideshow`, `image-banner`, `multicolumn`. Alpine: `collection-list` + `b-carousel` +
   `c-carousel-buttons` **(a)** → **bloqueado** hasta **Carousel** DS ([DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4)).
3. **Contenido / FAQ** — `collapsible-content`; `_collection-seo-faqs` **(a)** → **bloqueado** hasta
   **Faq** DS ([DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4)); `aa-hero-toggle-content`
   puede ir a `<details>` / `d-collapse` sin Faq.
4. **Blog / artículo** — `article-card` parcial (2e); EditorialCard pendiente.
5. **Producto al final** — `main-product` (JS-Q3 en [PR #16](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/16)),
   `featured-product` (JS-Q1 en `main`). Revisar `buy-buttons` (Alpine `$store.cart` sin `x-data` en PDP).

Inventario detallado por archivo: [`docs/ds-port-alpine-inventory.md`](./ds-port-alpine-inventory.md)
(en [PR #18](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/18) hasta merge).

Blocks `b-card-*` → EditorialCard / CollectionCard / ProductCard.
**Se quedan en el theme**: portable-text de Sanity, JSON-LD/SEO, hreflang, metaobjects,
`aa-cloudinary-image`, verificación de edad.

### Fase 5: Retirar legacy

**Orden obligatorio:** (1) **Bulma** — cuando `b-*` → 0, preflight Tailwind y retirar `b-style`; (2)
**Alpine** — los **12** archivos Liquid con `x-data` tras JS-C + residual sin `x-data` (`buy-buttons`,
`c-carousel-buttons`); no retirar `alpine-bundle.js` / `cart-store.js` hasta migrar cart y
`card-product` **(b)**; (3) `component-*.css` Dawn y loader CDN. Revisar `ai_gen_block_*`.

Tabla y orden de PRs sugeridos: [`docs/ds-port-alpine-inventory.md`](./ds-port-alpine-inventory.md)
([PR #18](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/18)).
Carruseles y FAQ siguen **bloqueados** sin Carousel/Faq en DS ([DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4)).

### Fase 6: Gates de CI

**Estado (2026-11-13): pendiente.** Este repo **no tiene workflows de GitHub Actions**; cada quien
abre el PR ejecuta en local:

- `npm run check:plt`
- `npm run check:theme-css`
- `npm run test:templates` (40/42 baseline)
- `shopify theme check` (CLI 3.91.0) ≤ **6 errores / 362 avisos**
- harness `LEGACY_LAYER=import` cuando toque markup DS
- diff visual / presupuesto CSS cuando existan capturas Fase 0

Objetivo futuro: automatizar lo anterior en CI tras baseline visual real.

## 4. Huecos a implementar primero en el DS

Tracking (checklist, un issue): **[DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4)** —
`RichText`, `TrustBar`, `LinkGrid`, `ChipPills`, `LocationCard`
(`service-area-link-list`, `location_map`), contrato de `MegaMenu`, `MarketSelector`, `Swatch`,
`StickyAddToCart`. Inventario: `PLT-design-system` `docs/storefront-component-inventory.md`.

**Aún no existen en el DS** (bloquean migraciones en el theme): componentes **`Carousel`** y **`Faq`**
(listados en DS#4). Hasta que estén en el paquete vendorizado, los carruseles Alpine
(`b-carousel`, `collection-list`, `c-carousel-buttons`) y el acordeón FAQ
(`_collection-seo-faqs`) quedan en espera.

Boolean filters (`filter.type == boolean` en `plt-filter-bar` Liquid):
**[DS#3](https://github.com/PlayLoveToys/PLT-design-system/issues/3)** /
PR **[DS#5](https://github.com/PlayLoveToys/PLT-design-system/pull/5)** (mergeado en DS `main`).
Adaptador en el theme: pin **`c27304c`** + `sync:plt` en
[PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17) (**en revisión**; en `main` sigue
`a2c759b` hasta merge).

## 5. Riesgos
- Convivencia de dos CSS: especificidad y peso durante la transición.
- Pérdida de control del merchant al pasar esquemas de color a temas fijos.
- Sin tienda de desarrollo no hay verificación visual real.
- Mantener dos themes Liquid en paralelo a largo plazo (`plt-frontend-liquid` y este).
