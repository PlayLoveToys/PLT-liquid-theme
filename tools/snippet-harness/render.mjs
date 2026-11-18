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
engine.registerTag('form', {
  parse(tagToken, remainTokens) {
    this.hash = tagToken.hash;
    this.templates = [];
    const stream = this.liquid.parser.parseStream(remainTokens);
    stream
      .on('tag:endform', () => stream.stop())
      .on('template', (tpl) => this.templates.push(tpl))
      .on('end', () => {
        throw new Error('form: missing endform');
      });
    stream.start();
  },
  *render(ctx, emitter) {
    const id = this.hash?.id ? ` id="${this.hash.id}"` : '';
    const klass = this.hash?.class ? ` class="${this.hash.class}"` : '';
    emitter.write(`<form${id}${klass} method="post" action="/cart/add" data-harness-form>`);
    yield this.liquid.renderer.renderTemplates(this.templates, ctx);
    emitter.write('</form>');
  },
});
engine.registerTag('endform', {
  parse() {},
  *render() {},
});
engine.registerTag('stylesheet', {
  parse(_token, remaining) {
    while (remaining.length && remaining[0].name !== 'endstylesheet') {
      remaining.shift();
    }
    if (remaining.length) remaining.shift();
  },
  *render() {},
});
engine.registerFilter('t', (key, ...rest) =>
  translate(key, Object.fromEntries(rest.filter(Array.isArray))),
);
engine.registerFilter('money_without_currency', (cents) => (Number(cents) / 100).toFixed(2));
engine.registerFilter('asset_url', (file) => `../../../assets/${file}`);

const {default: build} = await import(
  pathToFileURL(path.join(here, 'cases', `${name}.mjs`)).href
);
const body = await build({engine});

// The preview pane loads the page as a data: snapshot, so neither relative stylesheets nor
// module scripts resolve by URL: the CSS and the bundle are inlined.
const bundle = fs
  .readFileSync(path.join(theme, 'assets', 'plt-web-components.bundle.js'), 'utf8')
  .replace(/<\/script/g, '<\\/script');
// LEGACY_LAYER mirrors layout/theme.liquid: Dawn base.css in @layer legacy below theme.css.
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
const CAROUSEL_HARNESS_CASES = new Set([
  'carousel',
  'carousel-collection-card',
  'collection-list-carousel',
  'b-carousel-desktop',
]);
const carouselExtras = CAROUSEL_HARNESS_CASES.has(name)
  ? [
      `<style data-source="plt-carousel-compat.css">${readAsset('plt-carousel-compat.css')}</style>`,
      `<script defer>${readAsset('plt-carousel.js')}</script>`,
    ].join('\n')
  : '';
const PLT_CUSTOM_STYLE_CASES = new Set(['article-card-legacy-bulma']);
const pltCustomStyleExtra = PLT_CUSTOM_STYLE_CASES.has(name)
  ? `<style data-source="a-plt-custom-style.css">${readAsset('a-plt-custom-style.css')}</style>`
  : '';
const styles = [
  legacyLayer ? '<style>@layer legacy, theme, base, components, utilities;</style>' : '',
  `<style data-source="theme.css">${readAsset('theme.css')}</style>`,
  pltCustomStyleExtra,
  ...['base.css'].map(legacyStyle),
  carouselExtras,
].join('\n');
const page = `<!doctype html>
<html lang="en" data-theme="brand">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} harness</title>
${styles}
<style>
  :root { --font-body-scale: 1; --font-heading-scale: 1; --font-body-family: system-ui; }
  .case { padding: 12px 24px; border-bottom: 1px dashed #bbb; }
  .row { display: flex; gap: 48px; flex-wrap: wrap; }
  .case h3, .case h4 { margin: 4px 0; font: 600 13px system-ui; color: #555; }
  .plt-details-disclosure__summary { list-style: none; cursor: pointer; }
  .plt-details-disclosure__summary::-webkit-details-marker { display: none; }
  .plt-details-disclosure__summary .plt-details-disclosure__icon--open { display: none; }
  .plt-details-disclosure[open] .plt-details-disclosure__summary .plt-details-disclosure__icon--closed { display: none; }
  .plt-details-disclosure[open] .plt-details-disclosure__summary .plt-details-disclosure__icon--open { display: inline-flex; }
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
