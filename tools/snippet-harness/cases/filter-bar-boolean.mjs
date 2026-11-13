/**
 * Boolean metafield filters (`filter.type == 'boolean'`): vendor adapter maps them
 * like list checkbox groups (DS#5 / pin c27304c+). Banner must read PASS when synced.
 *
 * Fixture shape matches PLT-design-system `ssr-components.test.ts` (Organic Yes/No).
 */
const filters = [
  {
    type: 'list',
    param_name: 'filter.v.option.color',
    label: 'Color',
    active_values: [{}],
    values: [
      {label: 'Red', value: 'Red', active: true, count: 4},
      {label: 'Blue', value: 'Blue', active: false, count: 2},
    ],
  },
  {
    type: 'boolean',
    param_name: 'filter.p.m.custom.organic',
    label: 'Organic',
    active_values: [{value: '1'}],
    values: [
      {label: 'Yes', value: '1', active: true, count: 3},
      {label: 'No', value: '0', active: false, count: 0},
    ],
  },
  {
    type: 'price_range',
    param_name: 'filter.v.price',
    label: 'Price',
    range_min: 500,
    range_max: 20000,
    min_value: {param_name: 'filter.v.price.gte', value: '10'},
    max_value: {param_name: 'filter.v.price.lte', value: ''},
  },
];

export default async ({engine}) => {
  const data = {filters};
  const render = (template) => engine.parseAndRender(template, data);

  const filterBar = await render(
    `{% render 'plt-filter-bar', filters: filters, orientation: 'vertical', collapsible: true, sort_by: 'price-ascending', search_terms: 'gift', action: '/collections/all', script_url: 'none' %}`,
  );
  const sortPreserve = await render(
    `{% render 'plt-sort-select', options: sortOptions, current: 'price-ascending', filters: filters, search_terms: 'gift', action: '/collections/all', script_url: 'none' %}`,
    {
      sortOptions: [
        {name: 'Featured', value: 'manual'},
        {name: 'Price, low to high', value: 'price-ascending'},
      ],
    },
  );

  const booleanRendered = filterBar.includes('filter.p.m.custom.organic');
  const pinStatus = booleanRendered
    ? 'PASS (vendor adapter emits boolean group — pin includes DS#5)'
    : 'GAP (pin a2c759b: adapter skips filter.type boolean; bump pin after sync:plt)';

  return `
    <section class="case" id="filter-bar-boolean">
      <h3>Boolean metafield filter (Shopify <code>filter.type == 'boolean'</code>)</h3>
      <p class="theme-meta" style="max-width:52rem">
        Expect checkbox group <strong>Organic</strong> (Yes/No) beside Color and Price.
        WC contract needs no change — boolean is list-shaped in JSON.
        Sort preserve must carry active <code>filter.p.m.custom.organic=1</code> on sort change.
      </p>
      <p role="status" style="padding:0.75rem;border:1px solid var(--plt-color-border,#e8e0d6);border-radius:0.5rem;font:13px system-ui">
        Harness check: <strong>${pinStatus}</strong>
      </p>
      <div
        data-plt-section-nav
        data-plt-section-id="harness-boolean"
        data-plt-morph-target="#filter-bar-boolean"
      >
        <h4>plt-filter-bar</h4>
        ${filterBar}
        <h4>plt-sort-select (preserve boolean + list + price)</h4>
        ${sortPreserve}
      </div>
    </section>`;
};
