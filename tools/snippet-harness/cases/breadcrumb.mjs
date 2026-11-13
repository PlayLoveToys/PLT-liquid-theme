/**
 * Breadcrumb harness case.
 *
 * Limitación: `tools/snippet-harness/render.mjs` monta liquidjs solo con root
 * `snippets/`, así que los theme blocks no se pueden `{% render %}` como snippets.
 * Este caso lee `blocks/breadcrumb.liquid`, recorta `{% schema %}`, traduce
 * `{% style %}` → `<style>` y sustituye el drop Shopify `template` (string + `.name`
 * + `.directory`) por fixtures planas (`template_name` / `template_directory`) para
 * poder renderizar el Liquid real del block.
 *
 *   npm run harness:snippet -- breadcrumb
 *   LEGACY_LAYER=import npm run harness:snippet -- breadcrumb
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const defaultSettings = {
  home_text: 'Home',
  show_home_icon: true,
  separator_style: 'chevron',
  font_size: 14,
  font_weight: '400',
  background_color: '#f4f4f4',
  link_color: '#323841',
  link_hover_color: '#0c7489',
  link_hover_background: '#f4f4f4',
  current_color: '#323841',
  current_background: '#f4f4f4',
  separator_color: '#323841',
  focus_color: '#0c7489',
  padding_top: 16,
  padding_bottom: 16,
  item_spacing: 8,
  border_radius: 6,
};

const lingerie = {
  handle: 'lingerie',
  title: 'Lingerie',
  url: '/collections/lingerie',
};

function loadBlockSource() {
  let src = fs.readFileSync(path.join(theme, 'blocks', 'breadcrumb.liquid'), 'utf8');
  src = src.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/, '');
  src = src.replace(/\{%-?\s*style\s*-?%\}/g, '<style>');
  src = src.replace(/\{%-?\s*endstyle\s*-?%\}/g, '</style>');
  // Shopify `template` drop → fixtures planas para liquidjs.
  src = src.replaceAll('template.directory', 'template_directory');
  src = src.replaceAll('template.name', 'template_name');
  src = src.replaceAll('template ==', 'template_name ==');
  return src;
}

function blockFixture(id, settings = {}) {
  return {
    id,
    shopify_attributes: '',
    settings: {...defaultSettings, ...settings},
  };
}

export default async ({engine}) => {
  const source = loadBlockSource();
  const shared = {
    routes: {root_url: '/'},
    request: {origin: 'https://example.com', path: '/products/sample'},
    collections: {lingerie},
    page_title: 'Sample page',
  };

  const cases = [
    {
      title: 'Product (colección + actual)',
      data: {
        ...shared,
        template_name: 'product',
        template_directory: '',
        block: blockFixture('breadcrumb_product'),
        product: {
          title: 'Body encaje',
          url: '/products/body-encaje',
          collections: {first: lingerie},
        },
      },
    },
    {
      title: 'Collection',
      data: {
        ...shared,
        request: {origin: 'https://example.com', path: '/collections/lingerie'},
        template_name: 'collection',
        template_directory: '',
        block: blockFixture('breadcrumb_collection', {separator_style: 'slash'}),
        collection: lingerie,
      },
    },
    {
      title: 'Article',
      data: {
        ...shared,
        request: {origin: 'https://example.com', path: '/blogs/news/hello'},
        template_name: 'article',
        template_directory: '',
        block: blockFixture('breadcrumb_article', {separator_style: 'arrow', show_home_icon: false}),
        blog: {title: 'News', url: '/blogs/news'},
        article: {title: 'Hello', url: '/blogs/news/hello'},
      },
    },
    {
      title: 'Page',
      data: {
        ...shared,
        request: {origin: 'https://example.com', path: '/pages/about'},
        template_name: 'page',
        template_directory: '',
        block: blockFixture('breadcrumb_page'),
        page: {title: 'About', url: '/pages/about'},
      },
    },
    {
      title: 'Search con términos',
      data: {
        ...shared,
        request: {origin: 'https://example.com', path: '/search'},
        template_name: 'search',
        template_directory: '',
        block: blockFixture('breadcrumb_search'),
        search: {terms: 'vibrador'},
      },
    },
  ];

  let body = `
    <section class="case">
      <h3>Limitación harness</h3>
      <p style="max-width:60ch;font:14px/1.4 system-ui;color:#444">
        El harness solo monta <code>snippets/</code> como root de liquidjs. Este HTML se genera
        leyendo <code>blocks/breadcrumb.liquid</code> (sin schema) y adaptando el drop
        <code>template</code> de Shopify a fixtures. No es un emulador de theme blocks.
      </p>
    </section>`;

  for (const item of cases) {
    const html = await engine.parseAndRender(source, item.data);
    body += `<section class="case"><h3>${item.title}</h3>${html}</section>`;
  }

  return body;
};
