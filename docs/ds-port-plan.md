# Plan de port: PLT-liquid-theme → PLT-design-system

Destino: `git@github.com:PlayLoveToys/PLT-design-system.git` (paquete `@playlovetoys/platform`).
Decisión de dirección (2026-11-12): **port en este repo**. `plt-frontend-liquid` es el donante
de tooling (`sync-plt`, `check-theme-css`, `validate-template-json`, `styles/global.css`, harness y
specs Playwright), no de sections: solo comparten 18 de 65 sections y 9 de 89 snippets.

> Este repo es **público**: todo lo que se commitee aquí se publica.

### Git: `dev-ai` → `stage` → `main`

Ramas de trabajo y PRs de port salen de **`dev-ai`** y apuntan a **`dev-ai`** (no abrir features directo a `main`). Promoción: **`dev-ai` → `stage`** (QA) → **`main`** (producción). Aprobaciones: Chief of Staff puede mergear en `dev-ai`; **`stage` y `main` requieren Alejandro**. Detalle en [`CONTRIBUTING.md`](../CONTRIBUTING.md) y [`AGENTS.md`](../AGENTS.md).

**Última actualización:** 2026-11-21. Estado de ramas: **`dev-ai` @ `7e7891f`** (PRs #41–#53 mergeados), **`stage` @ `1800d42`** (PR #47) y **`main` @ `f6c4705`** (PR #26, producción). En `dev-ai`: pin DS `@playlovetoys/platform` en `bad8290` (upstream [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) ya mergeado en `1ad8166`, listo para bump + `plt-navbar`); Bulma y Alpine retirados y bloqueados en CI (`check:no-legacy` con `LEGACY_ENFORCE_BULMA=1`); 9 gates activos en `.github/workflows/ci.yml` y 41 casos de harness; `theme check` ≤ **6 errores / 362 avisos** y `test:templates:ci` (40/42) en baseline; 7 snippets `plt-*` vendorizados.

## 1. Punto de partida y estado actual (`dev-ai` @ `7e7891f`)

| Eje | Estado actual (`dev-ai` @ `7e7891f`) | Destino |
|---|---|---|
| Base CSS | Dawn `base.css` (79 KB en `@layer legacy`) + 37 `component-*.css` + `assets/theme.css` (149 KB, Tailwind 4 + daisyUI 5 `cheesecake`, sin preflight). **Bulma `b-style*.css` retirado** (antes ~1,26 MB con 71 `component-*.css` y 650 KB de Bulma) | daisyUI 5 + Tailwind 4, tokens `--plt-*`, tema `cheesecake`, sin Dawn legacy |
| Markup | **0 usos de `b-*`** (bloqueados por `check:no-legacy` con `LEGACY_ENFORCE_BULMA=1`; eran 492 / 52). Mapeo `settings_schema → --plt-*` en `snippets/_plt-ds-token-vars.liquid` ([PR #36](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/36)). Colisión `.grid` Dawn vs Tailwind resuelta en `styles/global.css` ([PR #50](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/50), [PR #53](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/53)). Quedan secciones Dawn y 31 archivos de formularios por migrar en Fase 4 | renderers Liquid del DS + `d-*` / `theme-*` / `plt-*` |
| JS | **0 archivos con `x-data`**; `alpine-bundle.js`, `cart-store.js` y `alpine-product-card.js` **retirados** y bloqueados por `check:no-legacy` ([inventario archivado](./ds-port-alpine-inventory.md)). Web Components Lit del DS activos en storefront (`plt-pagination`, `plt-filter-bar`, `plt-sort-select`, `plt-quantity-selector`, `plt-cart-drawer`); carruseles y disclosures sin Alpine | Web Components Lit del DS (incl. `plt-variant-picker`, `plt-navbar`, galería, quick-view) |
| Clases / snippets DS hoy | 7 snippets `plt-*` vendorizados (`plt-cart-drawer`, `plt-filter-bar`, `plt-pagination`, `plt-quantity-selector`, `plt-sort-select`, `plt-variant-picker`, `plt-web-components`); `d-*` / `theme-*` / `plt-product-card` activos en primitivas, cards, drawer, header/footer y colecciones. `plt-variant-picker` pendiente de cablear en PDP; `plt-navbar` listo en upstream `1ad8166` | cobertura completa de shell y templates |
| Tamaño | 63 sections, 95 snippets (incl. 7 `plt-*`), 36 blocks, 47 templates, 37 `component-*.css`, 41 casos de harness | |

### Baseline de calidad (`shopify theme check`, CLI 3.91.0)

| Momento | Errores | Avisos | Nota |
|---|---:|---:|---|
| **Histórico pre-port** (Fase 0, 2026-11-12) | 7 | 354 | Snapshot del theme antes de tooling DS / cortes 2* |
| **Baseline vigente** (CI en `dev-ai` / `stage` / `main`, 2026-11-13+) | **6** | **362** | Techo para todo PR hacia `dev-ai` (y promociones): `MissingAsset` (`facets.js`) resuelto en higiene 2c; +8 avisos por snippets vendorizados tras `sync:plt` |

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
3. Un PR por fase (idealmente por template dentro de la Fase 4) apuntando a `dev-ai`; cada uno pasa
   los 9 gates de CI (`.github/workflows/ci.yml`, 41 casos de harness), `theme check` sin superar el
   baseline vigente (**6 errores / 362 avisos**, CLI 3.91.0) y revisión visual (§ Fase 6).
4. Sin lógica Shopify en el DS: los renderers reciben datos ya normalizados (precio formateado, URLs).

## 3. Fases

### Fase 0: Red de seguridad

**Estado (2026-11-14; QA visual actualizado 2026-11-21):** capturas y smoke ejecutados en `aadigital-dev-00` (theme-dev + Chromium).
Baseline local en `docs/visual-baseline/fase-0/` (gitignored; no commit de PNGs hasta Fase 6). Las regresiones detectadas en el QA visual sobre `dev-ai` post-Bulma/Alpine se resolvieron en PRs #44–#45 y #48–#53.

- [x] Baseline de `theme check` y validación de templates (arriba).
- [x] Artefacto Fase 0: checklist páginas/viewports, placeholders de handles, instrucciones
  `visual-compare`, checklist layout (esta sección).
- [x] Capturas reales 390 / 768 / 1280 (pre-port `f5446a9` @9292 vs `main` @9293; 9 rutas).
- [x] Handles fixture documentados + cobertura verificada (2026-11-14); ver tabla y handles abajo.
- [x] Archivar PNGs/baseline bajo `docs/visual-baseline/fase-0/` (local; sin committear volúmenes masivos hasta Fase 6).
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
STOREFRONT_PASSWORD=***          # Preferences → password (theme-dev --store-password)
PRODUCT_HANDLE=the-inventory-not-tracked-snowboard
COLLECTION_HANDLE=all            # capturas/smoke: /collections/all (paginación + filtros)
COLLECTION_HANDLE_ALT=frontpage  # existe pero vacía / sin grid útil
ARTICLE=news/lorem-ipsum         # → /blogs/news/lorem-ipsum
PAGE_HANDLE=contact              # → /pages/contact
SEARCH_QUERY=snowboard           # confirmado: 16 resultados
```

**Notas theme-dev (2026-11-14):** templates con dynamic sources de metafields PLT
(`collection.json` hero/afterpage, metaobjects, `blog.custom-mansory-blog.json`) **fallan el upload**
en esta tienda sample. Mitigación: `--ignore` de metaobject / collection variants + neutralizar
temporalmente los `{{ collection.metafields… }}` en `collection.json` solo en la sesión local
(restaurar antes de commit). Snippets `_global-scripts-defer` / `defer-stylesheet` a veces no
resuelven en el preview (Liquid error en layout); no bloqueó capturas ni ATC.

**Cobertura verificada en el primer `theme-dev`:**

| Qué cubre el port | Resultado en aadigital-dev-00 |
|---|---|
| Paginación `plt-pagination` | **OK** en `/collections/all` (>20 productos) |
| `plt-filter-bar` / sort | **OK** Availability + Price (+ sort); no hay filtros boolean de producto tipados |
| `plt-quantity-selector` (JS-Q3) | **OK** en PDP fixture; **sin** quantity rules / variantes |
| Variant picker, galería | Hueco: el snowboard fixture es simple |
| Búsqueda | **OK** `?q=snowboard` (16 hits + filter-bar) |

Seguimiento opcional: producto con variantes + quantity rules en la tienda sample (no bloquea P1).

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

Ejecutada 2026-11-14 en theme-dev `:9293` (candidate `main`):

- [x] `theme.css` + `@import … layer(legacy)` de `base.css` / `b-style*.css` presentes en el HTML del layout.
- [~] Fondo `html` crema `#FAF7F2`: no siempre computado como crema en el primer paint (tokens/capa);
  comparar en `docs/visual-baseline/fase-0/home` vs pre-port.
- [~] LCP / CSS bloqueante por `@import` legacy: cualitativo vía capturas; medición formal → Fase 6.
- [x] Empates `component-*.css` vs Bulma `legacy`: sin bloqueo de smoke; regresiones visuales en PNGs.

### Fase 1: Tooling y tokens (sin cambio visual)
**Hecho (tooling inicial 2026-11-12; actualizado en `dev-ai` @ `7e7891f`, 2026-11-21):**
- [x] `package.json` con `@playlovetoys/platform` → **`bad8290`** (integrado en `dev-ai` vía [PR #41](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/41) tras [DS#18](https://github.com/PlayLoveToys/PLT-design-system/pull/18); antes `c27304c` en [PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17), `a2c759b` en corte 2a, `b0ba294` histórico). Upstream [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) ya está mergeado en `1ad8166`, listo para el siguiente bump de pin (`plt-navbar`).
  `tailwindcss`/`@tailwindcss/cli` 4, `daisyui` 5 (dev). Scripts `build:css`, `watch:css`, `sync:plt`, `check:plt`, `check:theme-css`, `check:theme-schemas`, `check:tailwind-arbitrary`, `check:no-legacy`, `check:theme-check`, `check:branch-flow`, `test:templates`, `test:templates:ci`, `test:harness`.
- [x] `scripts/` copiados y extendidos desde `plt-frontend-liquid`; `.gitignore` y `.shopifyignore` (excluye `node_modules`,
  `docs`, `scripts`, `styles`, `package*.json` de las operaciones de Shopify CLI).
- [x] `styles/global.css` → `assets/theme.css` (149 KB minificado). **Sin preflight de Tailwind**: solo capas
  `theme` + `utilities` y el tema `cheesecake`, para no pisar Dawn `base.css`. Daisy usa prefijo `d-`.
- [x] `sync:plt` vendoriza los artefactos DS: `assets/plt-web-components.bundle.js`, 7 `snippets/plt-*.liquid` y
  `styles/plt/*.css`. `check:plt` y `check:theme-css` pasan en CI.
- [x] `theme check`: de 7/354 (histórico pre-port) a **≤ 6/362** (baseline vigente en `ci/theme-check-baseline.json`; ver tabla §1).
- [x] Mapeo `settings_schema → --plt-*` implementado en `snippets/_plt-ds-token-vars.liquid` ([PR #36](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/36); detalle en [`docs/fase1-settings-token-map.md`](./fase1-settings-token-map.md)).
- [x] Colisión estructural Dawn `.grid` (flex) vs Tailwind `.grid` (CSS grid) resuelta en `styles/global.css` con `@source not inline` + puente mínimo en `@layer utilities` ([PR #50](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/50), [PR #53](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/53); detalle en [`docs/dawn-tailwind-class-collisions.md`](./dawn-tailwind-class-collisions.md)).

**Enlace de `assets/theme.css`:** enlazado en `layout/theme.liquid` desde corte 2b (2026-11-12) junto con la opción A (`@layer legacy` + `@import` de Dawn `base.css`; Bulma `b-style*.css` ya fue retirado en `dev-ai`). El adaptador `shopify` del DS (estilos a `body` / `.shopify-section`) sigue sin importarse a propósito mientras `base.css` permanezca en `legacy`.

Pendiente de la fase:
- **Preflight de Tailwind diferido** ([`docs/fase1-preflight.md`](./fase1-preflight.md)): aunque Bulma ya se retiró, el probe post-Bulma confirmó choque del preflight en `@layer base` contra Dawn `base.css` en `@layer legacy`. Se replanteará al retirar `base.css` o al acotarlo upstream ([DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24)).
- **Adaptador `shopify` del DS** (alias `--token-*`, fondo de `body`): diferido junto con el preflight acotado ([DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24)).
- **4 decisiones de tokens pendientes de Alejandro** ([`docs/fase1-settings-token-map.md`](./fase1-settings-token-map.md)):
  1. Fijar `--plt-font-accent` a Space Grotesk o mapear otro `font_picker`.
  2. Alinear `--plt-border-width` (`1.5px`) / `--plt-shadow-offset` (`2px`) con sliders Dawn o mantener `cheesecake` estricto.
  3. Exponer colores semánticos (`info`–`error`) en el theme editor o mantener `cheesecake` fijo.
  4. Mapear `card_corner_radius` también a contenedores distintos de product card (`collection_card_*`, `blog_card_*`).

### Fase 2: Primitivas y controles
`button`→`d-btn`; precio, badges, inputs, alertas, divider, breadcrumb; `card-product`→`product-card`;
cantidad, variantes, paginación, orden, filtros, galería y quick add→Web Components del DS (patrón:
cancelar `plt:*` y aplicar con Section Rendering).

**Higiene (2026-11-12, con corte 2c):** borrados sin referencias —
`snippets/card-product-Respaldo.liquid`, `snippets/price-BK.liquid`, `assets/base-BK.css`,
`assets/base-purged.css`. Script obsoleto a `facets.js` quitado de `sections/main-search.liquid`.
**Higiene 2d:** borrado `snippets/card-product-new.liquid` (sin referencias).
**Higiene 2f:** borrados `snippets/a-dummy-products.liquid` y `snippets/collection-itemlist-schema.liquid`.
**Higiene Fase 5 (c):** borrados sin referencias en templates — `sections/aa-banner-html-copy.liquid`,
`sections/main-collection-plt.liquid`, `snippets/predictive-search.liquid` (shell Alpine); entrada huérfana
`main-collection-plt` en `config/settings_data.json`. Se conserva el predictive search Dawn
(`sections/predictive-search.liquid`, `predictive-search.js`, `component-predictive-search.css`).

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

### Estado del port (2026-11-21 — `dev-ai` @ `7e7891f`)

Snapshot de ramas: **`dev-ai`** @ `7e7891f` (PR #53) · **`stage`** @ `1800d42` (PR #47) · **`main`** @ `f6c4705` (PR #26). Una fila por hito; sin duplicados.

| Estado | Ítem | Evidencia / enlace |
|---|---|---|
| **Hecho** | Fase 1 tooling + tokens + harness inicial | [PR #1](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/1) |
| **Hecho** | 2b CSS: `@layer legacy` + `theme.css` en layout | commit en PR #1 |
| **Hecho** | Cortes 2c–2f (divider, breadcrumb, price, card, badges, gift_card, button) | [PR #2](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/2)–[#5](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/5) |
| **Hecho** | 2a `plt-pagination` compact + `anchor` (pin `a2c759b`) | [PR #6](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/6) |
| **Hecho** | 2b JS-A/B/C plan + puente Section Rendering + `plt-filter-bar` + `<dialog>` | [PR #7](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/7)–[#9](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/9), [#12](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/12) |
| **Hecho** | 2b JS-Q0–Q3 `plt-quantity-selector` (`featured-product`, QOL, `main-product`) | [PR #10](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/10), [#15](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/15), [#16](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/16) (PR #13 cerrado sin merge; código vía #15) |
| **Hecho** | Fase 0 artefacto + capturas reales 390/768/1280 + smoke `aadigital-dev-00` | [PR #14](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/14); local `docs/visual-baseline/fase-0/` (9 rutas; gitignored) |
| **Hecho** | 2b boolean filters (`c27304c`) + inventario Alpine + sync docs + `buy-buttons` sin Alpine | [PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17)–[#19](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/19), [#22](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/22), [#25](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/25), [#26](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/26) |
| **Hecho** | Fase 3 shell-cart (`plt-cart-drawer` + bridge + footer/newsletter parcial) | código en `main` [`c57ea14`](https://github.com/PlayLoveToys/PLT-liquid-theme/commit/c57ea1426e33e3e6d73c0201392125fcd192a0b9); docs [PR #22](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/22) |
| **Hecho** | Integración stack del port en `dev-ai`: pin DS **`bad8290`** ([DS#18](https://github.com/PlayLoveToys/PLT-design-system/pull/18)), retiro total de **Bulma** (`b-style*.css`, `b-*`) y **Alpine** (`alpine-bundle.js`, `cart-store.js`, `alpine-product-card.js`, todos los `x-data`), colección/carruseles/heroes/FAQ sin Alpine | [PR #41](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/41) en `dev-ai` (integra #27, #29, #30, #37, #38, #40); enforcement `check:no-legacy` (`LEGACY_ENFORCE_BULMA=1`) |
| **Hecho** | Fase 1 mapeo `settings_schema → --plt-*` (`_plt-ds-token-vars.liquid`) + preflight diferido | [PR #36](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/36); [`docs/fase1-settings-token-map.md`](./fase1-settings-token-map.md), [`docs/fase1-preflight.md`](./fase1-preflight.md) |
| **Hecho** | Fase 6 CI activo (`.github/workflows/ci.yml`: `gates` + `branch-flow`, 9 gates, 41 casos de harness) + restauración de block schemas | [PR #43](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/43), [PR #46](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/46), [PR #33](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/33) |
| **Hecho** | Colisión `.grid` Dawn vs Tailwind resuelta estructuralmente en `styles/global.css` | [PR #50](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/50), [PR #53](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/53); [`docs/dawn-tailwind-class-collisions.md`](./dawn-tailwind-class-collisions.md) |
| **Hecho** | Correcciones Visual QA en `dev-ai` (home `a-matrix`, PDP/article/carousel, header drawer/mega-menú, sliders/facets) | [PR #44](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/44), [PR #45](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/45), [PR #48](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/48)–[#53](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/53) |
| **Hecho (upstream)** | Tracker [DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4) **CERRADO** (11 contratos `#7`–`#17` en `#18` `bad8290`) + `plt-navbar`/`plt-megamenu`/`plt-market-selector` en [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) (`1ad8166`) | Pendiente bump de pin `bad8290` → `1ad8166` en este repo |
| **Pendiente** | Bump pin `1ad8166` + adopción `plt-navbar` / `plt-megamenu` / `plt-market-selector` | Desbloqueado por [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) |
| **Pendiente** | Limpieza `cart-notification` huérfano | `assets/cart-notification.js`, `assets/component-cart-notification.css` |
| **Pendiente** | Fase 4 templates restantes (`search.json`, variantes colección, secciones Dawn `index.json`, contenido/FAQ Dawn, blog/`EditorialCard`, 31 archivos de formularios, PDP `plt-variant-picker`/buy-buttons/galería) | Ver checklist § Fase 4 |
| **Pendiente** | 4 decisiones de tokens de Alejandro | [`docs/fase1-settings-token-map.md`](./fase1-settings-token-map.md) |
| **Pendiente** | Retiro Dawn `base.css` + 37 `component-*.css` + preflight acotado / adaptador `shopify` | Fase 5 restante + [DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24) |
| **Pendiente** | Fase 6 diff visual automatizado en CI + rulesets de branch protection en GitHub | [`docs/branch-protection.md`](./branch-protection.md) |
| **Upstream DS** | Huecos nuevos en `PlayLoveToys/PLT-design-system` | [DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20)–[DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24) (ver § 4) |

### Lista de pendientes (2026-11-21)

Gates obligatorios en cada PR hacia `dev-ai`: los 9 gates de `.github/workflows/ci.yml` (`check:branch-flow`, `check:theme-check` ≤ **6/362**, `check:plt`, `check:theme-css`, `check:theme-schemas`, `check:tailwind-arbitrary`, `check:no-legacy` con `LEGACY_ENFORCE_BULMA=1`, `test:templates:ci` 40/42, `test:harness` 41 casos).

| P | Qué | Responsable / notas |
|---|---|---|
| **P1** | Bump pin `@playlovetoys/platform` (`bad8290` → `1ad8166`) + adopción `plt-navbar` / `plt-megamenu` / `plt-market-selector` | Desbloqueado tras [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) |
| **P1** | Limpieza de `cart-notification` huérfano (`assets/cart-notification.js`, `assets/component-cart-notification.css`) | Resto Dawn ya reemplazado por `plt-cart-drawer` |
| **P1** | Resolver las **4 decisiones de tokens** pendientes | Alejandro — [`docs/fase1-settings-token-map.md`](./fase1-settings-token-map.md) |
| **P1** | Promoción `dev-ai` (`7e7891f`) → `stage` (hoy en PR #47 `1800d42`) y QA hacia `main` (hoy en PR #26 `f6c4705`) | Alejandro (aprobación requerida por política de ramas) |
| **P2** | Fase 4 templates pendientes: `search.json`, variantes de colección, secciones Dawn `index.json`, contenido/FAQ Dawn, blog / `EditorialCard`, **31 archivos de formularios**, PDP (`plt-variant-picker`, `buy-buttons`, galería) | Un PR acotado por template/bloque; galería depende de [DS#21](https://github.com/PlayLoveToys/PLT-design-system/issues/21), quick-view/cart-line de [DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22) |
| **P2** | Configurar rulesets de branch protection en GitHub (`dev-ai`, `stage`, `main`) | Ver propuesta en [`docs/branch-protection.md`](./branch-protection.md) |
| **P3** | Fase 5 restante: retirar Dawn `base.css` (79 KB) + **37 `component-*.css`** | Conforme se cierren las secciones Dawn en Fase 4 |
| **P3** | Preflight acotado + adaptador `shopify` del DS | Bloqueado por convivencia con Dawn `base.css` ([`docs/fase1-preflight.md`](./fase1-preflight.md), [DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24)) |
| **P3** | Fase 6: diff visual automatizado en CI | 9 gates funcionales ya activos; falta visual diff |
| **Upstream** | Predictive Search ([DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20)), Galería PDP ([DS#21](https://github.com/PlayLoveToys/PLT-design-system/issues/21)), Quick View + Cart Line ([DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22)), Adaptadores Shopify estáticos sincronizables ([DS#23](https://github.com/PlayLoveToys/PLT-design-system/issues/23)), Preflight acotado / adaptador `shopify` ([DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24)) | `PlayLoveToys/PLT-design-system` |

### Fase 3: Shell

- **Cart (hecho en `main` y completado sin Alpine en `dev-ai`):** `cart-notification` → `plt-cart-drawer`
  (`snippets/cart-drawer.liquid` + `assets/plt-cart-drawer-bridge.js`). `header-cart-bubble.js`,
  `main-cart-footer`, `cart-item-b` y quick-add en `card-product` migrados fuera de `Alpine.store('cart')`
  (retirado en `dev-ai`). Pendiente: limpieza de `cart-notification` huérfano (`assets/cart-notification.js`,
  `assets/component-cart-notification.css`) y adopción futura de `plt-cart-line` / `plt-quick-view` ([DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22)).
- **Footer + newsletter (parcial):** tokens `theme-label-bold` / `d-input` / `d-btn*` sin renombrar settings merchant; formularios residuales Dawn incluidos en el lote de 31 archivos de Fase 4.
- **Header (paridad QA en `dev-ai`, [PR #51](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/51); adopción `plt-navbar` pendiente):** paridad de nav drawer y mega-menú restaurada en `dev-ai`. Con [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) mergeado en `1ad8166`, queda pendiente subir el pin y adoptar `plt-navbar` / `plt-megamenu` / `plt-market-selector`.
- **Predictive search (defer):** sigue sobre Dawn (`sections/predictive-search.liquid`, `assets/predictive-search.js`, `component-predictive-search.css`) con headings `theme-label-bold`; contrato + `plt-predictive-search.liquid` trackeados en [DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20).

### Fase 4: Sections por template

En `dev-ai` @ `7e7891f` **Bulma y Alpine ya fueron retirados por completo** (carruseles, heroes colapsables, FAQs y `card-product` migrados sin Alpine ni `b-*`). Lo que resta en Fase 4 es retirar las secciones y formularios **Dawn** residuales y cablear los componentes DS pendientes.

#### Checklist Fase 4 por template (un PR por template / eje)

| Orden | Template JSON / eje | Secciones / alcance | Estado | Notas |
|---:|---|---|---|---|
| 1 | `templates/collection.json` | `main-collection`, `main-collection-banner`, `featured-blog`, `after-page-*`, `aa-hero-toggle-content`, `collection-list` | hecho (sin Bulma/Alpine) | `collection.json` en `dev-ai` con grid Dawn + `card-product` sin Alpine, hero/carousel migrados |
| 2 | `templates/search.json` | `custom_section` + `main-search` | pendiente | facets WC listos; migrar cabecera/shell Dawn; predictive search en [DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20) |
| 2 | `templates/collection.plt.json` / `lingerie` / `sanity-*` | variantes de colección | pendiente | sin Bulma ni Alpine; quedan wrappers/secciones Dawn residuales |
| 3 | `templates/index.json` | secciones Dawn (`slideshow`, `image-banner`, `multicolumn`, etc.) | pendiente | carruseles y `a-matrix` ya sin Bulma/Alpine ([PR #41](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/41), [#48](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/48), [#50](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/50)); quedan secciones Dawn |
| 4 | páginas de contenido / FAQ | `collapsible-content` y secciones Dawn de contenido | pendiente | `_collection-seo-faqs` y heroes toggle ya sin Alpine en `dev-ai`; quedan secciones Dawn |
| 5 | `templates/blog*.json`, `article*.json` | grids blog + `EditorialCard` | pendiente | `article-card` solo parcial (2e); `EditorialCard` pendiente ([DS#23](https://github.com/PlayLoveToys/PLT-design-system/issues/23)) |
| 5 | Formularios (transversal) | **31 archivos de formularios** (login, cuenta, direcciones, contacto, newsletter, comentarios, reset) | pendiente | markup Dawn `field__input` / `form__message` / botones Dawn |
| 6 | `templates/product*.json` | `main-product`, `plt-variant-picker`, `buy-buttons`, galería, bundles | pendiente | qty WC (JS-Q3) en `main` y `dev-ai`; `plt-variant-picker` vendorizado sin cablear; galería en [DS#21](https://github.com/PlayLoveToys/PLT-design-system/issues/21); quick-view en [DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22) |

**Se quedan en el theme:** portable-text de Sanity, JSON-LD/SEO, hreflang, metaobjects,
`aa-cloudinary-image`, verificación de edad.

### Fase 5: Retirar legacy

1. **Bulma — HECHO en `dev-ai`:** `assets/b-style.css`, `assets/b-style.source.css` y todas las clases `b-*` retirados y bloqueados permanentemente por `check:no-legacy` (`LEGACY_ENFORCE_BULMA=1` en CI).
2. **Alpine — HECHO en `dev-ai`:** `assets/alpine-bundle.js`, `assets/cart-store.js`, `assets/alpine-product-card.js` y todos los `x-data` / directivas Alpine retirados (**0 hits**), bloqueados permanentemente por `check:no-legacy`. Ver registro archivado en [`docs/ds-port-alpine-inventory.md`](./ds-port-alpine-inventory.md).
3. **Pendiente de Fase 5 (Dawn legacy):**
   - Limpieza de `cart-notification` huérfano (`assets/cart-notification.js`, `assets/component-cart-notification.css`).
   - Retiro de Dawn `assets/base.css` (79 KB en `@layer legacy`) y **37 `assets/component-*.css`** al completar las secciones Dawn de Fase 4.
   - Preflight Tailwind acotado / adaptador `shopify` del DS ([`docs/fase1-preflight.md`](./fase1-preflight.md), [DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24)).
   - Revisar `ai_gen_block_*` y assets/snippets huérfanos restantes.

### Fase 6: Gates de CI

**Estado (2026-11-21):** workflow [`ci.yml`](../.github/workflows/ci.yml) activo en `dev-ai` (y promociones) en push y PR hacia **`dev-ai`**, **`stage`** y **`main`**. Ejecuta **9 gates** en dos jobs (`branch-flow` + `gates`) con **41 casos de harness**. Ver [`CONTRIBUTING.md`](../CONTRIBUTING.md).

- Job `branch-flow` (PRs): `check:branch-flow` (solo `dev-ai` → `stage`, `stage` → `main`)
- Job `gates`:
  1. `check:theme-check` (Shopify CLI 3.91.0) ≤ **6 / 362** (`ci/theme-check-baseline.json`)
  2. `check:plt`
  3. `check:theme-css`
  4. `check:theme-schemas` (`--self-test` + validación)
  5. `check:tailwind-arbitrary`
  6. `check:no-legacy` con `LEGACY_ENFORCE_BULMA=1` (bloquea Bulma + Alpine)
  7. `test:templates:ci` (40/42 allowlist baseline)
  8. `test:harness` (**41 casos** + checks de layout en Playwright Chromium)

**Pendiente de Fase 6:**
- Diff visual automatizado en CI (capturas Fase 0 siguen en local).
- Configurar los rulesets de branch protection en GitHub para `dev-ai`, `stage` y `main` ([`docs/branch-protection.md`](./branch-protection.md)).

## 4. Huecos y estado upstream en el DS (`PlayLoveToys/PLT-design-system`)

### Cerrados en upstream
- **Tracker [DS#4](https://github.com/PlayLoveToys/PLT-design-system/issues/4) — CERRADO:** los 11 contratos (`#7`–`#17`: `RichText`, `TrustBar`, `LinkGrid`, `ChipPills`, `LocationCard`, `MegaMenu`, `MarketSelector`, `Swatch`, `StickyAddToCart`, `Carousel`, `Faq`) fueron mergeados vía **[DS#18](https://github.com/PlayLoveToys/PLT-design-system/pull/18)** (`bad8290`, ya pineado en `dev-ai`).
- **Navbar / MegaMenu / MarketSelector — [DS#19](https://github.com/PlayLoveToys/PLT-design-system/pull/19) (`1ad8166`):** mergeado en DS `main`, listo para bump de pin y adopción en el theme.
- **Boolean filters — [DS#3](https://github.com/PlayLoveToys/PLT-design-system/issues/3) / [DS#5](https://github.com/PlayLoveToys/PLT-design-system/pull/5):** mergeado en DS `main` y adoptado en este repo desde [PR #17](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/17).

### Huecos upstream activos (nuevos issues)
Los huecos restantes entre este theme y el DS se rastrean en los siguientes issues de `PlayLoveToys/PLT-design-system`:

| Issue | Alcance | Impacto en `PLT-liquid-theme` |
|---|---|---|
| [DS#20](https://github.com/PlayLoveToys/PLT-design-system/issues/20) | Contrato de Predictive Search + `plt-predictive-search.liquid` | Reemplazar `sections/predictive-search.liquid` / `predictive-search.js` (Dawn) |
| [DS#21](https://github.com/PlayLoveToys/PLT-design-system/issues/21) | `plt-product-gallery.liquid` | Migrar galería de medios en PDP (`main-product`) |
| [DS#22](https://github.com/PlayLoveToys/PLT-design-system/issues/22) | `plt-quick-view.liquid` y `plt-cart-line.liquid` | Quick view en cards y líneas de carrito / página `/cart` con WC DS |
| [DS#23](https://github.com/PlayLoveToys/PLT-design-system/issues/23) | Adaptadores Shopify sincronizables para renderers estáticos del DS | Reducir markup duplicado en Liquid (`EditorialCard`, cards, bloques estáticos) |
| [DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24) | Preflight acotado / compatibilidad del adaptador `shopify` del DS con Dawn `base.css` | Desbloquear activación del preflight Tailwind y adaptador `shopify` sin regresión en Dawn |

## 5. Riesgos
- Convivencia residual de Dawn (`base.css` + 37 `component-*.css`) con `theme.css`: la colisión `.grid` quedó resuelta en `styles/global.css` ([PR #50](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/50), [#53](https://github.com/PlayLoveToys/PLT-liquid-theme/pull/53)), pero el preflight de Tailwind sigue diferido hasta retirar `base.css` o acotarlo ([DS#24](https://github.com/PlayLoveToys/PLT-design-system/issues/24)).
- Pérdida o ambigüedad de control del merchant sobre tokens: quedan 4 decisiones abiertas con Alejandro ([`docs/fase1-settings-token-map.md`](./fase1-settings-token-map.md)).
- Sin diff visual automatizado en CI todavía (los 41 casos de harness cubren regresiones de layout/estructura, no capturas completas de tienda).
- Branch protection rulesets aún pendientes de activar en GitHub ([`docs/branch-protection.md`](./branch-protection.md)); hoy el control depende del gate `check:branch-flow`.
- Mantener dos themes Liquid en paralelo a largo plazo (`plt-frontend-liquid` y este).
