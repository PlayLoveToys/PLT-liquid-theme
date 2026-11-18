// Quick-add standard (single variant) on plt-product-card markup.
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const media = (alt = 'Product photo') => ({
  alt,
  src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png',
  width: 600,
  height: 600,
});

const singleVariant = {
  id: 2001,
  title: 'Single-variant toy',
  url: '/products/single',
  vendor: 'Play Love Toys',
  available: true,
  price: 3499,
  price_min: 3499,
  price_max: 3499,
  compare_at_price: null,
  price_varies: false,
  compare_at_price_varies: false,
  quantity_price_breaks_configured: false,
  variants_count: 1,
  featured_media: media(),
  selected_or_first_available_variant: {
    id: 9101,
    price: 3499,
    compare_at_price: null,
    available: true,
    quantity_rule: {min: 1, max: null, increment: 1},
    quantity_price_breaks: [],
  },
  metafields: {reviews: {rating: {value: null}, rating_count: 0}},
};

const multiVariant = {
  ...singleVariant,
  id: 2002,
  title: 'Multi-variant toy',
  url: '/products/multi',
  variants_count: 3,
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
    return `<img src="${url}" alt="${alt}" loading="lazy">`;
  });
  engine.registerFilter('inline_asset_content', () => '<svg aria-hidden="true"></svg>');
  engine.registerFilter('placeholder_svg_tag', () => '');

  const data = {
    settings: {currency_code_enabled: false},
    section: {id: 'harness-quick-add'},
    singleVariant,
    multiVariant,
  };

  const single = await engine.parseAndRender(
    `{% render 'card-product', card_product: singleVariant, quick_add: 'standard', section_id: section.id %}`,
    data,
  );
  const multi = await engine.parseAndRender(
    `{% render 'card-product', card_product: multiVariant, quick_add: 'standard', section_id: section.id %}`,
    data,
  );

  const cell = (html) =>
    `<div class="harness-product-card-cell" style="width:16rem;max-width:100%">${html}</div>`;

  return `
    <section class="case"><h3>Quick-add ATC (1 variante)</h3>
      <p>Esperado: &lt;product-form&gt; + botón quick-add__submit</p>
      <div class="row">${cell(single)}</div></section>
    <section class="case"><h3>Quick-add modal (N variantes)</h3>
      <p>Esperado: modal-opener + quick-add-modal</p>
      <div class="row">${cell(multi)}</div></section>`;
};