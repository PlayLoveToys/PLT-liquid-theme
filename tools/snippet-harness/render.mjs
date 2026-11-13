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
const page = `<!doctype html>
<html lang="en" data-theme="brand">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} harness</title>
${['theme.css', 'base.css', 'b-style.css']
  .map((file) => `<style data-source="${file}">${fs.readFileSync(path.join(theme, 'assets', file), 'utf8')}</style>`)
  .join('\n')}
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
fs.writeFileSync(path.join(out, `${name}.html`), page);
process.stdout.write(`Wrote tools/snippet-harness/.out/${name}.html\n`);
