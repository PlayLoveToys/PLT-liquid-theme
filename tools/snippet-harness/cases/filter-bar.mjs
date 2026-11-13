/**
 * JS-B harness: plt-filter-bar (+ sort) with preserve, under a section-nav root.
 */
const sortOptions = [
  {name: 'Featured', value: 'manual'},
  {name: 'Best selling', value: 'best-selling'},
  {name: 'Price, low to high', value: 'price-ascending'},
];

const filters = [
  {
    type: 'list',
    param_name: 'filter.p.vendor',
    label: 'Vendor',
    values: [
      {label: 'Play Love', value: 'Play Love', active: true, count: 4, param_name: 'filter.p.vendor'},
      {label: 'Other', value: 'Other', active: false, count: 2, param_name: 'filter.p.vendor'},
      {label: 'Empty', value: 'Empty', active: false, count: 0, param_name: 'filter.p.vendor'},
    ],
  },
  {
    type: 'price_range',
    param_name: 'filter.v.price',
    label: 'Price',
    min_value: {param_name: 'filter.v.price.gte', value: '10'},
    max_value: {param_name: 'filter.v.price.lte', value: ''},
    range_min: 0,
    range_max: 100,
  },
];

export default async ({engine}) => {
  const render = (src, ctx = {}) => engine.parseAndRender(src, ctx);

  const sort = await render(
    `{% render 'plt-sort-select', options: sortOptions, current: 'best-selling', filters: filters, search_terms: 'bunny', action: '/collections/all', script_url: 'none' %}`,
    {sortOptions, filters},
  );
  const filterBar = await render(
    `{% render 'plt-filter-bar', filters: filters, orientation: 'vertical', collapsible: true, sort_by: 'best-selling', search_terms: 'bunny', action: '/collections/all', script_url: 'none' %}`,
    {filters},
  );

  return `
    <section class="case">
      <h3>JS-B drawer body (sort + filter-bar)</h3>
      <div
        id="product-grid-container"
        data-plt-section-nav
        data-plt-section-id="harness"
        data-plt-morph-target="#product-grid-container"
      >
        <div class="row">
          <div><h4>plt-sort-select</h4>${sort}</div>
          <div><h4>plt-filter-bar</h4>${filterBar}</div>
        </div>
        <p id="grid-stub" class="theme-meta">Morph target stub (grid would replace here in storefront).</p>
      </div>
    </section>
  `;
};
