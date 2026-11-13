// Shopify-shaped fixtures for the layout divider block settings.
const baseSettings = {
  thickness: 1,
  corner_radius: 'square',
  width_percent: 100,
  'padding-block-start': 8,
  'padding-block-end': 8,
};

export default async ({engine}) => {
  const variants = [
    {
      title: 'Default (100%, 1px, square)',
      id: 'harness-default',
      settings: {...baseSettings},
    },
    {
      title: 'Thick rounded, 60%, left',
      id: 'harness-thick',
      settings: {
        ...baseSettings,
        thickness: 4,
        corner_radius: 'rounded',
        width_percent: 60,
        alignment_horizontal: 'left',
        'padding-block-start': 16,
        'padding-block-end': 16,
      },
    },
    {
      title: 'Hairline, 40%, right',
      id: 'harness-hairline',
      settings: {
        ...baseSettings,
        thickness: 0.5,
        width_percent: 40,
        alignment_horizontal: 'right',
      },
    },
    {
      title: 'Full width flag',
      id: 'harness-full',
      settings: {...baseSettings, thickness: 3, width_percent: 50},
      full_width: true,
    },
  ];

  let body = '';
  for (const variant of variants) {
    const html = await engine.parseAndRender(
      `{% render 'divider', id: id, settings: settings, full_width: full_width %}`,
      {
        id: variant.id,
        settings: variant.settings,
        full_width: variant.full_width ?? false,
      },
    );
    body += `<section class="case"><h3>${variant.title}</h3>
      <p class="theme-meta" style="margin:0 0 8px">Above</p>
      ${html}
      <p class="theme-meta" style="margin:8px 0 0">Below</p>
    </section>`;
  }

  body += `<section class="case"><h3>DS reference (theme-divider)</h3>
    <hr class="theme-divider">
  </section>`;

  return body;
};
