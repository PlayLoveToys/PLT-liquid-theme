/**
 * Harness para `sections/a-logo-motto.liquid`: con logo y sin logo (caso index home).
 *
 *   npm run harness:snippet -- a-logo-motto
 *   LEGACY_LAYER=import npm run harness:snippet -- a-logo-motto
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const placeholderLogo = {
  alt: 'Play Love Toys',
  src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-logo_large.png',
  width: 300,
  height: 300,
};

function loadSectionSource() {
  let src = fs.readFileSync(path.join(theme, 'sections', 'a-logo-motto.liquid'), 'utf8');
  return src.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/, '');
}

export default async ({engine}) => {
  engine.registerFilter('image_url', (source) => {
    if (!source) throw new Error('invalid url input');
    if (typeof source === 'string') return source;
    return source.src || source.url || '';
  });
  engine.registerFilter('image_tag', (url, ...rest) => {
    const opts = Object.fromEntries(rest.filter(Array.isArray));
    const alt = opts.alt ?? '';
    const loading = opts.loading ?? 'lazy';
    return `<img src="${url}" alt="${alt}" loading="${loading}">`;
  });

  const source = loadSectionSource();
  const cases = [
    {
      title: 'Sin logo (Embrace Your Sexual Wellness — index)',
      section: {
        id: 'a_logo_motto_47YBzW',
        settings: {
          logo: null,
          motto_title: 'Embrace Your Sexual Wellness',
          motto: 'Discover products curated for pleasure and wellbeing.',
        },
      },
    },
    {
      title: 'Con logo',
      section: {
        id: 'a_logo_motto_with_logo',
        settings: {
          logo: placeholderLogo,
          motto_title: 'Embrace Your Sexual Wellness',
          motto: 'Discover products curated for pleasure and wellbeing.',
        },
      },
    },
  ];

  let body = '';
  for (const item of cases) {
    const html = await engine.parseAndRender(source, {section: item.section});
    body += `<section class="case"><h3>${item.title}</h3>${html}</section>`;
  }

  return body;
};