// Fixtures for snippets/price.liquid + card-product badge markup (DS d-badge / price typography).
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const baseProduct = {
  price: 2499,
  price_min: 2499,
  price_max: 2499,
  compare_at_price: null,
  price_varies: false,
  compare_at_price_varies: false,
  available: true,
  quantity_price_breaks_configured: false,
  selected_or_first_available_variant: {
    price: 2499,
    compare_at_price: null,
    available: true,
    unit_price: null,
    unit_price_measurement: null,
  },
};

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);

  const data = {
    settings: {currency_code_enabled: false},
    regular: {...baseProduct},
    onSale: {
      ...baseProduct,
      price: 1999,
      price_min: 1999,
      price_max: 1999,
      compare_at_price: 2999,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        price: 1999,
        compare_at_price: 2999,
      },
    },
    soldOut: {
      ...baseProduct,
      available: false,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        available: false,
      },
    },
    fromPrice: {
      ...baseProduct,
      price: 1499,
      price_min: 1499,
      price_max: 3999,
      price_varies: true,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        price: 1499,
      },
    },
    pdp: {
      ...baseProduct,
      price: 1999,
      price_min: 1999,
      price_max: 1999,
      compare_at_price: 2999,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        price: 1999,
        compare_at_price: 2999,
      },
    },
  };

  const render = (template) => engine.parseAndRender(template, data);

  const cardRegular = await render(
    `{% render 'price', product: regular, show_compare_at_price: true %}`,
  );
  const cardSale = await render(
    `{% render 'price', product: onSale, show_compare_at_price: true %}`,
  );
  const cardSoldOut = await render(
    `{% render 'price', product: soldOut, show_compare_at_price: true %}`,
  );
  const cardFrom = await render(
    `{% render 'price', product: fromPrice, show_compare_at_price: true %}`,
  );
  const placeholder = await render(
    `{% render 'price', placeholder: true, show_compare_at_price: true %}`,
  );
  const pdpBadges = await render(
    `{% render 'price', product: pdp, use_variant: true, show_badges: true, price_class: 'price--large' %}`,
  );
  const predictive = await render(
    `{% render 'price', product: onSale, use_variant: true, show_badges: false %}`,
  );

  const cardBadges = `
    <div style="position:relative;width:180px;height:120px;border:1px solid #ccc;background:#f3f0ea">
      <span class="b-tag-bottom-right d-badge theme-label-bold">Sold out</span>
    </div>
    <div style="position:relative;width:180px;height:120px;border:1px solid #ccc;background:#f3f0ea">
      <span class="b-tag-bottom-right d-badge d-badge-secondary theme-label-bold">Sale</span>
    </div>`;

  // Mirrors sections/main-product.liquid: outer #price-{{ section.id }} is what
  // assets/product-info.js updates via Section Rendering (innerHTML swap).
  const pdpContract = `
    <div id="price-harness-section" role="status">
      ${pdpBadges}
    </div>
    <p class="theme-meta">Outer id preserved for product-info.js → updateSourceFromDestination('price')</p>`;

  return `
    <section class="case"><h3>Card price — regular</h3>${cardRegular}</section>
    <section class="case"><h3>Card price — on sale (+ compare)</h3>${cardSale}</section>
    <section class="case"><h3>Card price — sold out</h3>${cardSoldOut}</section>
    <section class="case"><h3>Card price — from / varies</h3>${cardFrom}</section>
    <section class="case"><h3>Placeholder</h3>${placeholder}</section>
    <section class="case"><h3>Predictive search (use_variant, no badges)</h3>${predictive}</section>
    <section class="case"><h3>PDP price block (show_badges + price--large) inside #price-*</h3>${pdpContract}</section>
    <section class="case"><h3>Card image badges (position + d-badge)</h3>
      <div class="row">${cardBadges}</div></section>`;
};
