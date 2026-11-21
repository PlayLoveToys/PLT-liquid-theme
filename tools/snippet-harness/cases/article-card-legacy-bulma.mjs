/** Real c-card-article → article.d-card.plt-legacy-bulma-info-light-card */
import {harnessOutPath, verifyArticleLegacyCard} from '../lib/verify-article-legacy-card.mjs';

export default async ({engine}) => {
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return (
      source.src ||
      'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'
    );
  });
  engine.registerFilter('image_tag', (url) =>
    `<img src="${url}" alt="" loading="lazy" class="h-full w-full object-cover">`,
  );
  engine.registerFilter('strip_html', (value) =>
    String(value ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  engine.registerFilter('truncatewords', (value, count = 20) => {
    const words = String(value ?? '')
      .split(/\s+/)
      .filter(Boolean);
    return words.length > count ? `${words.slice(0, count).join(' ')}…` : words.join(' ');
  });

  const block = {
    shopify_attributes: '',
    settings: {
      article: {
        title: 'How we pick materials for intimate toys',
        url: '/blogs/news/how-we-pick-materials',
        excerpt: 'A short look at body-safe materials and why we care about certifications.',
        content: '',
        image: {
          alt: 'Article cover',
          src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png',
        },
      },
      show_excerpt: true,
      truncatewords: 20,
      priority: false,
    },
  };

  const card = await engine.parseAndRender(`{% render 'c-card-article', block: block %}`, {block});

  return `<section class="case" id="zone-article-card-legacy-bulma">
    <h3>c-card-article — plt-legacy-bulma-info-light-card</h3>
    <div class="harness-article-card-cell" style="width:18rem;max-width:100%">${card}</div>
    <p class="hint">Requires a-plt-custom-style.css: 12px radius, info-light background.</p>
  </section>`;
};

export async function verify({root}) {
  await verifyArticleLegacyCard(harnessOutPath(root, 'article-card-legacy-bulma'));
}