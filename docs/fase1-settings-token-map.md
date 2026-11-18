# Fase 1: mapeo `settings_schema` → tokens `--plt-*`

**Rama:** `cursor/fase1-preflight-tokens-a5e3`  
**Implementación:** `snippets/_plt-ds-token-vars.liquid` (invocado desde `layout/theme.liquid`).  
**Ids de `config/settings_schema.json`:** sin cambios (restricción dura del port).

Los tokens se emiten en dos ámbitos:

1. **Por esquema de color** (clases `.color-{id}` y `:root` para el primer esquema): colores semánticos del DS ligados a `color_scheme_group` / `color_schemes`.
2. **Globales en `:root`:** tipografía, radios, anchos de página y geometría fija del tema cheesecake.

## Colores por `color_schemes` (editable por el merchant)

| Token `--plt-*` | Setting del esquema (`definition.id`) | Notas |
| --- | --- | --- |
| `--plt-color-base-100` | `background` | Color sólido de fondo del esquema. |
| `--plt-color-base-200` | *(derivado)* | `background` aclarado ~4 % (Liquid `color_lighten`). |
| `--plt-color-base-300` | *(derivado)* | `background` oscurecido ~6 % (`color_darken`). |
| `--plt-color-base-content` | `text` | Texto principal. |
| `--plt-color-primary` | `button` | Fondo del botón primario Dawn → primario DS. |
| `--plt-color-primary-content` | `button_label` | Texto sobre primario. |
| `--plt-color-secondary` | `secondary_button_label` | En PLT suele ser rosa marca (`#F4436C`). |
| `--plt-color-secondary-content` | `button_label` | Mismo contraste que botón primario. |
| `--plt-color-accent` | `shadow` | **Convención PLT:** el campo Dawn `shadow` guarda el acento teal (`#0C7489`), no el color de sombra CSS. |
| `--plt-color-accent-content` | `button_label` | |
| `--plt-color-neutral` | `text` | |
| `--plt-color-neutral-content` | `background` | |
| `--plt-border-color` | `text` | |
| `--plt-shadow-color` | `text` | |
| `--plt-color-info` … `--plt-color-error-content` | — | **PROPUESTA (fijo cheesecake):** no hay settings; valores `oklch` del DS hasta aprobación de producto. |

`background_gradient` sigue usándose solo en variables Dawn (`--gradient-background`); el DS aún no consume gradientes de esquema en Fase 1.

## Tipografía (`settings_schema.typography`)

| Token | Setting `id` | Editable |
| --- | --- | --- |
| `--plt-font-display` | `type_header_font` | Sí |
| `--plt-font-body` | `type_body_font` | Sí |
| `--plt-font-accent` | — | **PROPUESTA fijo:** `"Space Grotesk"` (cheesecake); no hay `font_picker` dedicado. |

`heading_scale`, `body_scale`, `font_scale_*` siguen alimentando solo variables Dawn (`--font-*-scale`); el escalado fluido `--plt-text-*` del DS permanece del pin hasta Fase 2+.

## Botones, inputs, cards (global)

| Token | Setting `id` | Editable | Notas |
| --- | --- | --- | --- |
| `--plt-radius-field` | `inputs_radius` | Sí | px |
| `--plt-radius-selector` | `variant_pills_radius` | Sí | px; pastillas / selectores. |
| `--plt-radius-box` | `card_corner_radius` | Sí | `÷ 10` → rem (misma fórmula que Dawn `--product-card-corner-radius`). |
| `--plt-page-width` | `page_width` | Sí | `÷ 10` → rem |
| `--plt-border-width` | — | **PROPUESTA fijo `1.5px`** | Merchant tiene `buttons_border_thickness` (suele ser 1 px). Ver desvío. |
| `--plt-section-border-width` | — | **PROPUESTA fijo `3px`** | Sin setting equivalente en schema. |
| `--plt-shadow-offset` | — | **PROPUESTA `2px`** | Dawn usa sombras blur (`buttons_shadow_*`); DS usa offset duro. |
| `--plt-shadow-hover-offset` | — | **PROPUESTA `5px`** | |
| `--plt-shadow-active-offset` | — | **PROPUESTA `0px`** | |
| `--plt-merchant-buttons-border-px` | `buttons_border_thickness` + `buttons_border_opacity` | Sí (telemetría) | No sustituye `--plt-border-width`; documenta valor Dawn para migraciones. |
| `--plt-merchant-buttons-radius-px` | `buttons_radius` | Sí (telemetría) | |
| `--plt-merchant-buttons-shadow-y` | `buttons_shadow_vertical_offset` | Sí (si `buttons_shadow_opacity` > 0) | |

Settings de cards (`card_*`, `collection_card_*`, `blog_card_*`), media, popup, drawer, badges, etc. **siguen solo en variables Dawn** (`--product-card-*`, …) en esta fase; los consumidores `d-*` / WC leen `--plt-*` global o el esquema de la sección.

## Desvíos conocidos DS ↔ Liquid merchant

| Eje | DS (cheesecake) | Theme editor (típico PLT) | Decisión Fase 1 |
| --- | --- | --- | --- |
| Borde | `1.5px` (`--plt-border-width`) | `buttons_border_thickness: 1` | Token DS fijo; merchant expuesto vía `--plt-merchant-buttons-border-px`. |
| Sombra | offset `2px` / hover `5px` | blur + offset vertical 4px, opacidad 30 % | Tokens DS fijos; sombra Dawn intacta para legacy. |
| Acento / secondary | tokens dedicados | `shadow` + `secondary_button_label` en esquemas | Mapeo explícito arriba. |

## Pendiente de aprobación (Alejandro)

1. ¿Fijar `--plt-font-accent` a Space Grotesk o mapear otro `font_picker`?  
2. ¿Alinear `--plt-border-width` / `--plt-shadow-offset` con sliders Dawn o mantener cheesecake estricto?  
3. ¿Exponer colores semánticos (`info`, `success`, …) en el theme editor o dejar cheesecake fijo?  
4. ¿Mapear `card_corner_radius` también a contenedores distintos de product card (`collection_card_*`, `blog_card_*`)?