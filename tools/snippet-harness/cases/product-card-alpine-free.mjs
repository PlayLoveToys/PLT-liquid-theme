// Fase 5: card-product must not emit Alpine directives.
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const media = (alt = 'Product photo') => ({
  alt,
  src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png',
  width: 600,
  height: 600,
});

const baseProduct = {
  id: 1001,
  title: 'Cheesecake vibrator',
  url: '/products/cheesecake',
  vendor: 'Play Love Toys',
  available: true,
  price: 2499,
  price_min: 2499,
  price_max: 2499,
  compare_at_price: null,
  price_varies: false,
  compare_at_price_varies: false,
  quantity_price_breaks_configured: false,
  variants_count: 1,
  featured_media: media(),
  selected_or_first_available_variant: {
    id: 9001,
    price: 2499,
    compare_at_price: null,
    available: true,
    quantity_rule: {min: 1, max: null, increment: 1},
    quantity_price_breaks: [],
    unit_price: null,
    unit_price_measurement: null,
  },
  metafields: {reviews: {rating: {value: null}, rating_count: 0}},
};

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return source.src || source.url || '';
  });
  engine.registerFilter('image_tag', (url, ...rest) => {
    const opts = Object.fromEntries(rest.filter(Array.isArray));
    const alt = opts.alt ?? '';
    const loading = opts.loading ?? 'lazy';
    const style = opts.style ?? '';
    return `<img src="${url}" alt="${alt}" loading="${loading}"${style ? ` style="${style}"` : ''}>`;
  });
  engine.registerFilter('inline_asset_content', () => '<svg aria-hidden="true"></svg>');
  engine.registerFilter('placeholder_svg_tag', (name, className = '') =>
    `<svg class="${className}" viewBox="0 0 100 100" role="img" aria-label="${name}"></svg>`,
  );

  const data = {
    settings: {currency_code_enabled: false},
    section: {id: 'harness-product-card'},
    regular: baseProduct,
    quick_add: 'standard',
  };

  const html = await engine.parseAndRender(
    `{% render 'card-product', card_product: regular, show_vendor: true, quick_add: quick_add, section_id: section.id %}`,
    data,
  );

  const alpinePattern = /\bx-(data|show|text|cloak|model|bind|on)|@click|\$store/;
  const hits = html.match(new RegExp(alpinePattern.source, 'gi')) || [];

  const cell = (body) =>
    `<div class="harness-product-card-cell" style="width:16rem;max-width:100%">${body}</div>`;

  return `
    <section class="case">
      <h3>card-product sin Alpine</h3>
      <p>Coincidencias Alpine: <strong>${hits.length}</strong> (esperado: 0)</p>
      <div class="row">${cell(html)}</div>
    </section>`;
};