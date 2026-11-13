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
| Clases del DS hoy | `d-*`: 0, `theme-*`: 0, `plt-*`: 2 (`plt-product-modal`, `plt-gradient-background`) | |
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
| **MissingAsset** | 1 | **`sections/main-search.liquid` referencia `assets/facets.js`, que no existe** (bug previo; los filtros de búsqueda dependen de esto) |

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
- [ ] Decidir sobre `facets.js` ausente (¿se restaura o la búsqueda ya no lo usa?) antes de la Fase 2.

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

**Decisión deliberada: `assets/theme.css` aún NO se enlaza en `layout/theme.liquid`.** Sin capturas de la
Fase 0 no hay forma de comprobar que no altera la tienda (el tema trae reglas base globales y el adaptador
`shopify` añade estilos a `body` y `.shopify-section`, que por eso tampoco se importa). El primer enlace va con
la primera migración de la Fase 2, ya verificada visualmente.

Pendiente de la fase:
- Reintroducir preflight de Tailwind cuando se retire Bulma (Fase 5).
- Adaptador `shopify` del DS (alias `--token-*`, fondo de `body`): activar junto al enlace del CSS.
- **Riesgo central** (sigue abierto): colisiones de nombre (`button`, `card`, `menu`, `modal`) con Dawn/Bulma;
  mitigado por el prefijo `d-`, a confirmar con capturas.
- Mapear `settings_schema` (color_schemes, tipografía, botones, inputs, cards) a tokens. Decisión de
  producto abierta: qué sigue editable por el merchant y qué pasa a fijo.
- Desvíos conocidos del DS vs Liquid `brand`: borde 1.5 px vs 2 px, sombra 2 px vs 4 px.

### Fase 2: Primitivas y controles
`button`→`d-btn`; precio, badges, inputs, alertas, divider, breadcrumb; `card-product`→`product-card`;
cantidad, variantes, paginación, orden, filtros, galería y quick add→Web Components del DS (patrón de
`facets.js`: cancelar `plt:*` y aplicar con Section Rendering). Borrar muertos: `card-product-Respaldo`,
`price-BK`, `base-BK`, `base-purged`.

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

**Enlace de `theme.css` en el layout: aún no.** Análisis hecho (válido para cuando haya un consumidor):
`theme.css` no tiene selectores de elemento globales sin capa, 0 colisiones de variables con el CSS legacy
(246 variables propias) y las reglas del DS viven en capas, así que el CSS legacy, que no usa capas, gana
siempre en un conflicto. Pesa 128 KB (~20 KB gz): se enlaza con el primer corte que sí funcione.

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
