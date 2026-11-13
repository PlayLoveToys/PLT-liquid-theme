// Fixtures for snippets/card-product.liquid → DS plt-product-card markup (Alpine shell kept).
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
  featured_media: media(),
  selected_or_first_available_variant: {
    price: 2499,
    compare_at_price: null,
    available: true,
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
  engine.registerFilter('placeholder_svg_tag', (name, className = '') =>
    `<svg class="${className}" viewBox="0 0 100 100" role="img" aria-label="${name}"><rect width="100" height="100" fill="#e8e2d9"/><text x="50" y="54" text-anchor="middle" fill="#888" font-size="8">${name}</text></svg>`,
  );

  const data = {
    settings: {currency_code_enabled: false},
    section: {id: 'harness-product-card'},
    regular: {...baseProduct},
    onSale: {
      ...baseProduct,
      id: 1002,
      title: 'On-sale toy',
      price: 1999,
      price_min: 1999,
      price_max: 1999,
      compare_at_price: 2999,
      available: true,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        price: 1999,
        compare_at_price: 2999,
      },
    },
    soldOut: {
      ...baseProduct,
      id: 1003,
      title: 'Sold-out toy',
      available: false,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        available: false,
      },
    },
    rated: {
      ...baseProduct,
      id: 1004,
      title: 'Rated toy',
      metafields: {
        reviews: {
          rating: {value: {rating: 4.5, scale_max: 5}},
          rating_count: 12,
        },
      },
    },
  };

  const render = (template, extra = {}) =>
    engine.parseAndRender(template, {...data, ...extra});

  const regular = await render(
    `{% render 'card-product', card_product: regular, show_vendor: true %}`,
  );
  const sale = await render(
    `{% render 'card-product', card_product: onSale, show_vendor: true %}`,
  );
  const sold = await render(
    `{% render 'card-product', card_product: soldOut, show_vendor: true %}`,
  );
  const rated = await render(
    `{% render 'card-product', card_product: rated, show_vendor: true, show_rating: true %}`,
  );
  const placeholder = await render(
    `{% render 'card-product', show_vendor: true, placeholder_image: 'product-apparel-1' %}`,
  );

  const dsReference = `
    <article class="d-card bg-base-100 theme-bordered theme-elevated plt-media-card plt-product-card" style="width:16rem">
      <a class="plt-media-card__media" href="#">
        <img src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png" alt="DS reference" loading="lazy">
      </a>
      <div class="d-card-body plt-media-card__body">
        <span class="d-badge d-badge-secondary theme-label-bold">Sale</span>
        <h3 class="d-card-title theme-headline-sm plt-media-card__title"><a href="#">DS ProductCard</a></h3>
        <p class="theme-meta plt-media-card__meta">Play Love Toys</p>
        <div class="d-card-actions plt-media-card__actions">
          <span class="plt-product-card__price">$19.99 <span class="plt-product-card__compare-price">$29.99</span></span>
        </div>
      </div>
    </article>`;

  // plt-product-card sets min-width:0 (container queries). In a flex .row without a
  // definite width the card collapses; storefront grids give .grid__item a track size.
  const cell = (html) =>
    `<div class="harness-product-card-cell" style="width:16rem;max-width:100%">${html}</div>`;

  return `
    <section class="case"><h3>Regular</h3>
      <div class="row">${cell(regular)}</div></section>
    <section class="case"><h3>On sale (+ badge)</h3>
      <div class="row">${cell(sale)}</div></section>
    <section class="case"><h3>Sold out (+ badge)</h3>
      <div class="row">${cell(sold)}</div></section>
    <section class="case"><h3>With rating</h3>
      <div class="row">${cell(rated)}</div></section>
    <section class="case"><h3>Placeholder / onboarding</h3>
      <div class="row">${cell(placeholder)}</div></section>
    <section class="case"><h3>DS renderer reference</h3>
      <div class="row">${dsReference}</div></section>`;
};
