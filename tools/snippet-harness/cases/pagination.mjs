// Shopify's `paginate.parts`: the current page is a non-link part, gaps are "&hellip;".
const paginateFor = (current, total) => {
  const parts = [];
  const visible = [1, 2, current - 1, current, current + 1, total - 1, total].filter(
    (page) => page >= 1 && page <= total,
  );
  let last = 0;
  for (const page of [...new Set(visible)].sort((a, b) => a - b)) {
    if (page - last > 1) parts.push({title: '&hellip;', is_link: false});
    parts.push(
      page === current
        ? {title: String(page), is_link: false}
        : {title: String(page), is_link: true, url: `?page=${page}`},
    );
    last = page;
  }

  return {
    current_page: current,
    pages: total,
    parts,
    previous: current > 1 ? {is_link: true, url: `?page=${current - 1}`} : {is_link: false},
    next: current < total ? {is_link: true, url: `?page=${current + 1}`} : {is_link: false},
  };
};

export default async ({engine}) => {
  let body = '';
  for (const [current, total] of [[1, 12], [5, 12], [12, 12], [2, 3]]) {
    const paginate = paginateFor(current, total);
    const shared = await engine.parseAndRender(`{% render 'pagination', paginate: paginate %}`, {paginate});
    const withAnchor = await engine.parseAndRender(
      `{% render 'pagination', paginate: paginate, anchor: '#Comments-123' %}`,
      {paginate},
    );
    body += `<section class="case"><h3>Page ${current} of ${total}</h3><div class="row">
      <div><h4>Shared (plt-pagination compact)</h4>${shared}</div>
      <div><h4>With anchor (#Comments-123)</h4>${withAnchor}</div></div></section>`;
  }

  return body;
};
