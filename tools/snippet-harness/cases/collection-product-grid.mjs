/**
 * Harness: collection PDP grid shell (main-collection.liquid pattern) with DS card-product cells.
 */
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
  type: 'Vibrators',
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

const collectionFlags = {
  show_vendor: true,
  show_type: true,
  collection_grid_free_badge: true,
  show_savings_percentage: true,
  media_aspect_ratio: 'square',
  pad_color: 'ffffff',
};

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (source, ...args) => {
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
  const data = {
    settings: {currency_code_enabled: false, card_style: 'card'},
    section: {id: 'harness-collection-grid'},
    products: [
      {...baseProduct},
      {
        ...baseProduct,
        id: 1002,
        title: 'On-sale toy',
        type: 'Accessories',
        compare_at_price: 2999,
        price: 1999,
        price_min: 1999,
        selected_or_first_available_variant: {
          ...baseProduct.selected_or_first_available_variant,
          price: 1999,
          compare_at_price: 2999,
        },
      },
      {
        ...baseProduct,
        id: 1003,
        title: 'Premium bundle',
        type: 'Bundles',
        price: 7900,
        price_min: 7900,
        compare_at_price: null,
        selected_or_first_available_variant: {
          ...baseProduct.selected_or_first_available_variant,
          price: 7900,
          compare_at_price: null,
        },
      },
    ],
  };

  const cards = [];
  for (const product of data.products) {
    cards.push(
      await engine.parseAndRender(
        `{% render 'card-product',
          card_product: product,
          show_vendor: true,
          show_type: true,
          collection_grid_free_badge: true,
          show_savings_percentage: true,
          media_aspect_ratio: 'square',
          pad_color: 'ffffff'
        %}`,
        {product, settings: data.settings, section: data.section, ...collectionFlags},
      ),
    );
  }

  /* Stack #38 badge styles (harness preview only; production CSS comes from merged #37/#39) */
  const stackPreviewCss = `
    .plt-product-card__media-link { position: relative; display: block; }
    .plt-product-card__collection-free-badge {
      position: absolute; top: 0.5rem; left: 0.5rem; z-index: 1; pointer-events: none;
      border: 0; background-color: hsl(346deg 89% 61%); color: #fff;
      font-size: 0.75rem; line-height: 1.25; padding: 0.2rem 0.45rem; gap: 0.25rem;
    }
  `;

  return `
    <style data-harness-preview>${stackPreviewCss}</style>
    <section class="case">
      <h3>Collection product grid (2/4 + 5 widescreen; free ship, type, % OFF)</h3>
      <div class="collection" style="max-width:72rem;margin:0 auto">
        <ul
          class="grid product-grid contains-card contains-card--product grid--2-col-tablet-down grid--4-col-desktop grid--5-col-widescreen"
          role="list"
          style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr))"
        >
          ${cards.map((html) => `<li class="grid__item">${html}</li>`).join('\n')}
        </ul>
      </div>
    </section>`;
};