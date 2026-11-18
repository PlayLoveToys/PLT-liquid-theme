const icons = {
  fold: 'm356-160-56-56 180-180 180 180-56 56-124-124-124 124Zm124-404L300-744l56-56 124 124 124-124 56 56-180 180Z',
  unfold: 'M480-120 300-300l58-58 122 122 122-122 58 58-180 180ZM358-598l-58-58 180-180 180 180-58 58-122-122-122 122Z',
};

export default async ({engine}) => {
  const iconHtml = await engine.parseAndRender(
    `{% render '_plt-collapse-icons', fold_path: fold, unfold_path: unfold, icon_class: 'b-icon b-has-text-link' %}`,
    icons,
  );

  const variants = [
    {title: 'Cerrado (default)', panel_id: 'harness-closed', initial_open: false},
    {title: 'Abierto inicial', panel_id: 'harness-open', initial_open: true},
  ];

  let body = '';
  for (const variant of variants) {
    const summary = `<span class="b-button b-is-link b-is-outlined">${iconHtml}<span>Learn more</span></span>`;
    const html = await engine.parseAndRender(
      `{% render '_plt-details-disclosure',
        panel_id: panel_id,
        initial_open: initial_open,
        summary_markup: summary,
        content_markup: content,
        summary_class: 'plt-details-disclosure__summary'
      %}`,
      {
        panel_id: variant.panel_id,
        initial_open: variant.initial_open,
        summary,
        content: '<div class="b-content">Harness body copy for expandable hero panel.</div>',
      },
    );
    body += `<section class="case"><h3>${variant.title}</h3>${html}</section>`;
  }
  return body;
};