// Fixtures for snippets/cart-item-b.liquid → <plt-cart-line> (no Alpine).
const money = (cents) => `$${(Number(cents) / 100).toFixed(2)}`;

const image = {
  alt: 'Sample toy',
  src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png',
};

const baseItem = {
  key: '42:123456789:abc123',
  quantity: 2,
  url: '/products/sample-toy',
  final_price: 2499,
  final_line_price: 4998,
  original_line_price: 4998,
  variant: {title: 'Purple / One size'},
  product: {
    title: 'Sample toy',
    has_only_default_variant: false,
    vendor: 'Play Love Toys',
  },
  options_with_values: [{name: 'Color', value: 'Purple'}],
  image,
};

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (img, _width) => {
    if (!img) return '';
    return img.src || '';
  });

  const data = {
    item: baseItem,
    onSale: {
      ...baseItem,
      key: 'sale-line',
      original_line_price: 5998,
      final_line_price: 4998,
    },
    singleVariant: {
      ...baseItem,
      key: 'default-only',
      quantity: 1,
      product: {
        ...baseItem.product,
        has_only_default_variant: true,
      },
      variant: {title: 'Default Title'},
    },
  };

  const render = (extra = {}) =>
    engine.parseAndRender(`{% render 'cart-item-b', item: item %}`, {...data, ...extra});

  const standard = await render();
  const sale = await render({item: data.onSale});
  const single = await render({item: data.singleVariant});

  return `
    <section class="case"><h3>Standard line (variant + qty 2)</h3>
      <ul class="plt-cart-lines">${standard}</ul></section>
    <section class="case"><h3>Compare-at line price</h3>
      <ul class="plt-cart-lines">${sale}</ul></section>
    <section class="case"><h3>Default variant only</h3>
      <ul class="plt-cart-lines">${single}</ul></section>
    <p class="theme-meta">Interact: +/- and Remove dispatch <code>plt:cart-line-*</code> (bridge required on storefront).</p>`;
};