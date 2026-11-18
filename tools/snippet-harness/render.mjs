/**
 * Renders real theme snippets with liquidjs next to the theme's real CSS, so a migrated
 * snippet can be looked at in a browser without a Shopify store.
 *
 *   npm run harness:snippet -- pagination     # → tools/snippet-harness/.out/pagination.html
 *
 * A case (tools/snippet-harness/cases/<name>.mjs) default-exports
 * `async ({engine}) => htmlBody`. Not a Shopify emulator: only the filters below exist, so a
 * case supplies fixture data for whatever the snippet reads.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Liquid} from 'liquidjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const theme = path.resolve(here, '..', '..');
const name = process.argv[2];

if (!name) {
  throw new Error('Usage: node tools/snippet-harness/render.mjs <case>');
}

const locale = JSON.parse(
  fs
    .readFileSync(path.join(theme, 'locales', 'en.default.json'), 'utf8')
    .replace(/^\s*\/\*[\s\S]*?\*\//, ''),
);
const translate = (key, args = {}) => {
  const value = key.split('.').reduce((node, part) => node?.[part], locale) ?? key;
  return String(value).replace(/{{\s*(\w+)\s*}}/g, (_, arg) => args[arg] ?? '');
};

const engine = new Liquid({
  root: [path.join(theme, 'snippets')],
  extname: '.liquid',
  strictFilters: false,
});
engine.registerTag('doc', {
  parse(_token, remaining) {
    while (remaining.length) {
      if (remaining.shift().name === 'enddoc') return;
    }
  },
  *render() {},
});
engine.registerFilter('t', (key, ...rest) =>
  translate(key, Object.fromEntries(rest.filter(Array.isArray))),
);
engine.registerFilter('money_without_currency', (cents) => (Number(cents) / 100).toFixed(2));
engine.registerFilter('asset_url', (file) => `../../../assets/${file}`);

const hexToRgb = (hex) => {
  const h = String(hex).replace('#', '');
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
};
const rgbToHex = ([r, g, b]) =>
  `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`;
const mixRgb = (rgb, factor) => rgbToHex(rgb.map((v) => v * factor));
engine.registerFilter('color_lighten', (color, amount) =>
  mixRgb(hexToRgb(color), 1 + Number(amount) / 100),
);
engine.registerFilter('color_darken', (color, amount) =>
  mixRgb(hexToRgb(color), 1 - Number(amount) / 100),
);

/** Shopify font_picker → objeto en runtime; en settings_data solo hay el handle. */
const harnessFont = (handle, family) => ({
  family,
  fallback_families: 'sans-serif',
  style: 'normal',
  weight: 400,
  system: false,
  handle,
});

const pltDsTokenStyle = async () => {
  const settingsData = JSON.parse(
    fs.readFileSync(path.join(theme, 'config', 'settings_data.json'), 'utf8'),
  );
  const raw = settingsData.current;
  const settings = {
    ...raw,
    type_header_font: harnessFont(raw.type_header_font, 'Roboto Condensed'),
    type_body_font: harnessFont(raw.type_body_font, 'Inter'),
  };
  const color_schemes = Object.entries(raw.color_schemes ?? {}).map(([id, entry]) => ({
    id,
    settings: entry.settings ?? entry,
  }));
  if (color_schemes.length === 0) return '';
  const first = color_schemes[0];
  const tokenTpl = `{% for scheme in color_schemes -%}
{% if forloop.first %}:root,{% endif %}
.color-{{ scheme.id }} {
{% render '_plt-ds-token-vars', scope: 'color_scheme', scheme: scheme %}
}
{% endfor -%}
:root {
{% render '_plt-ds-token-vars', scope: 'global' %}
}
`;
  const css = await engine.parseAndRender(tokenTpl, {color_schemes, settings, scheme: first});
  return `<style data-source="plt-ds-tokens">${css}</style>`;
};

const {default: build} = await import(
  pathToFileURL(path.join(here, 'cases', `${name}.mjs`)).href
);
const body = await build({engine});

// The preview pane loads the page as a data: snapshot, so neither relative stylesheets nor
// module scripts resolve by URL: the CSS and the bundle are inlined.
const bundle = fs
  .readFileSync(path.join(theme, 'assets', 'plt-web-components.bundle.js'), 'utf8')
  .replace(/<\/script/g, '<\\/script');
// LEGACY_LAYER mirrors layout/theme.liquid (docs/ds-port-plan.md, cut 2b): the Dawn/Bulma CSS goes into a
// cascade layer below the design system's. `1` wraps it in `@layer legacy {}`; `import` loads it through
// `@import url(...) layer(legacy)` (data: URLs, the same syntax the layout uses with the CDN asset URL).
const legacyLayer = process.env.LEGACY_LAYER === '1' || process.env.LEGACY_LAYER === 'import';
const readAsset = (file) => fs.readFileSync(path.join(theme, 'assets', file), 'utf8');
const legacyStyle = (file) => {
  const css = readAsset(file).replace(/^\uFEFF/, '');
  if (process.env.LEGACY_LAYER === 'import') {
    const url = `data:text/css;base64,${Buffer.from(css).toString('base64')}`;
    return `<style data-source="${file}">@import url('${url}') layer(legacy);</style>`;
  }
  return `<style data-source="${file}">${legacyLayer ? `@layer legacy {${css}}` : css}</style>`;
};
const pltTokens =
  process.env.PLT_DS_TOKENS === '1' ? await pltDsTokenStyle() : '';
const styles = [
  legacyLayer ? '<style>@layer legacy, theme, base, components, utilities;</style>' : '',
  pltTokens,
  `<style data-source="theme.css">${readAsset('theme.css')}</style>`,
  ...['base.css', 'b-style.css'].map(legacyStyle),
].join('\n');
const page = `<!doctype html>
<html lang="en" data-theme="brand">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} harness</title>
${styles}
<style>
  :root { --font-body-scale: 1; --font-heading-scale: 1; --font-body-family: system-ui; --b-family-primary: system-ui; }
  .case { padding: 12px 24px; border-bottom: 1px dashed #bbb; }
  .row { display: flex; gap: 48px; flex-wrap: wrap; }
  .case h3, .case h4 { margin: 4px 0; font: 600 13px system-ui; color: #555; }
</style>
</head>
<body>
${body.replace(/<script type="module" src="[^"]*"><\/script>/g, '')}
<script type="module">${bundle}</script>
</body>
</html>
`;

const out = path.join(here, '.out');
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, `${name}${legacyLayer ? '.layered' : ''}.html`), page);
process.stdout.write(`Wrote tools/snippet-harness/.out/${name}${legacyLayer ? ".layered" : ""}.html\n`);
