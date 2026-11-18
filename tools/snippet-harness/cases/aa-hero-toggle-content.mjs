import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default async ({engine}) => {
  engine.registerFilter('image_url', () => '');
  engine.registerFilter('image_tag', () => '');

  const sectionLiquid = fs.readFileSync(
    path.join(theme, 'sections', 'aa-hero-toggle-content.liquid'),
    'utf8',
  );
  const sectionSource = sectionLiquid.split('{% schema %}')[0];

  const openHtml = await engine.parseAndRender(sectionSource, {
    section: {
      id: 'harness-aa-hero',
      settings: {
        title_htag: 'h1',
        subtitle_htag: 'h2',
        this_title: 'Harness hero title',
        this_subtitle: 'Harness hero subtitle',
        button_text: 'Shop now',
        button_url: '/collections/all',
        expandable_content: '<p>Expanded rich text from theme settings.</p>',
        initial_expanded: true,
        hero_image: null,
      },
    },
  });

  const closedHtml = await engine.parseAndRender(sectionSource, {
    section: {
      id: 'harness-aa-hero-closed',
      settings: {
        title_htag: 'h1',
        subtitle_htag: 'h2',
        this_title: 'Collapsed by default',
        this_subtitle: 'Toggle closed initially',
        button_text: '',
        button_url: '',
        expandable_content: '<p>Hidden until summary is activated.</p>',
        initial_expanded: false,
        hero_image: null,
      },
    },
  });

  return `<section class="case"><h3>aa-hero-toggle-content (initial open)</h3>${openHtml}</section>
<section class="case"><h3>aa-hero-toggle-content (initial closed)</h3>${closedHtml}</section>`;
};