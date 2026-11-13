/**
 * JS-A harness: plt-sort-select with active filters + search `q` preserved.
 * Looks at preserve hidden inputs / attribute without Alpine.
 */
const sortOptions = [
  {name: 'Featured', value: 'manual'},
  {name: 'Best selling', value: 'best-selling'},
  {name: 'Price, low to high', value: 'price-ascending'},
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
    active_values: [{}],
    values: [
      {label: 'Silicone', value: 'silicone', count: 12, active: true},
      {label: 'Glass', value: 'glass', count: 9, active: false},
    ],
  },
  {
    type: 'price_range',
    label: 'Price',
    param_name: 'filter.v.price',
    range_min: 500,
    range_max: 25000,
    min_value: {param_name: 'filter.v.price.gte', value: 1000},
    max_value: {param_name: 'filter.v.price.lte', value: 8000},
  },
];

export default async ({engine}) => {
  const data = {sortOptions, filters};
  const render = (template) => engine.parseAndRender(template, data);
  const sortOnly = await render(
    `{% render 'plt-sort-select', options: sortOptions, current: 'best-selling', script_url: 'none' %}`,
  );
  const sortPreserve = await render(
    `{% render 'plt-sort-select', options: sortOptions, current: 'price-ascending', filters: filters, search_terms: 'bunny', action: '/collections/all', script_url: 'none' %}`,
  );

  return `
    <section class="case"><h3>Sort only (no preserve)</h3>${sortOnly}</section>
    <section class="case" id="sort-preserve">
      <h3>Sort + preserve filters + q</h3>
      <p style="font:12px system-ui;color:#666;max-width:52rem">
        Fallback and Lit forms must keep <code>q=bunny</code>,
        <code>filter.v.availability=1</code>, <code>filter.p.m.custom.material=silicone</code>,
        and price bounds when sort changes (native GET or cancelled <code>plt:sort-change</code>).
      </p>
      <div data-plt-section-nav data-plt-section-id="harness" data-plt-morph-target="#sort-preserve">
        ${sortPreserve}
      </div>
    </section>`;
};
