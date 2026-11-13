// Shopify-shaped fixtures for the shared controls: sort, filters and quantity.
const sortOptions = [
  {name: 'Featured', value: 'manual'},
  {name: 'Best selling', value: 'best-selling'},
  {name: 'Alphabetically, A-Z', value: 'title-ascending'},
  {name: 'Price, low to high', value: 'price-ascending'},
  {name: 'Price, high to low', value: 'price-descending'},
];

const filters = [
  {
    type: 'list',
    label: 'Availability',
    param_name: 'filter.v.availability',
    active_values: [{}],
    values: [
      {label: 'In stock', value: '1', count: 42, active: true},
      {label: 'Out of stock', value: '0', count: 0, active: false},
    ],
  },
  {
    type: 'list',
    label: 'Material',
    param_name: 'filter.p.m.custom.material',
    active_values: [],
    values: ['Silicone', 'Glass', 'Metal', 'Rubber'].map((label, index) => ({
      label,
      value: label.toLowerCase(),
      count: 12 - index * 3,
      active: false,
    })),
  },
  {
    type: 'price_range',
    label: 'Price',
    param_name: 'filter.v.price',
    range_min: 500,
    range_max: 25000,
    min_value: {param_name: 'filter.v.price.gte', value: null},
    max_value: {param_name: 'filter.v.price.lte', value: null},
  },
];

export default async ({engine}) => {
  const data = {sortOptions, filters};
  const render = (template) => engine.parseAndRender(template, data);
  const sort = await render(
    `{% render 'plt-sort-select', options: sortOptions, current: 'best-selling', filters: filters, search_terms: '' %}`,
  );
  const filterBar = await render(
    `{% render 'plt-filter-bar', filters: filters, orientation: 'vertical', collapsible: true, sort_by: 'best-selling' %}`,
  );
  const filterBarHorizontal = await render(`{% render 'plt-filter-bar', filters: filters %}`);
  const quantity = await render(
    `{% render 'plt-quantity-selector', value: 2, min: 1, step: 1, max: 10, name: 'quantity' %}`,
  );
  const quantityRule = await render(
    `{% render 'plt-quantity-selector', value: 6, min: 6, step: 6, name: 'quantity' %}`,
  );

  return `
    <section class="case"><h3>Sort select</h3>${sort}</section>
    <section class="case"><h3>Quantity (1–10) and quantity rule (min 6, step 6)</h3>
      <div class="row"><div>${quantity}</div><div>${quantityRule}</div></div></section>
    <section class="case"><h3>Filter bar, vertical + collapsible</h3><div style="max-width:320px">${filterBar}</div></section>
    <section class="case"><h3>Filter bar, horizontal</h3>${filterBarHorizontal}</section>
    <section class="case" data-legacy><h3>Legacy Bulma markup (must stay styled)</h3>
      <button class="b-button b-is-primary">Primary</button>
      <button class="b-button b-is-light">Light</button>
      <input class="b-input" type="text" placeholder="b-input" style="max-width:200px">
      <label class="b-checkbox"><input type="checkbox" checked> b-checkbox</label></section>`;
};
