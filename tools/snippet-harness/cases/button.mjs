// Fixtures for snippets/button.liquid → Dawn style_class values mapped to d-btn.
export default async ({engine}) => {
  const variants = [
    {
      title: 'Primary (style_class=button)',
      style_class: 'button',
      label: 'Shop all',
      link: '/collections/all',
    },
    {
      title: 'Secondary (style_class=button-secondary)',
      style_class: 'button-secondary',
      label: 'Learn more',
      link: '/pages/about',
    },
    {
      title: 'Link (style_class=link)',
      style_class: 'link',
      label: 'Continue reading',
      link: '/blogs/news',
    },
    {
      title: 'Disabled (blank link)',
      style_class: 'button',
      label: 'Unavailable',
      link: '',
    },
  ];

  let body = '';
  for (const variant of variants) {
    const html = await engine.parseAndRender(`{% render 'button', link: link, block: block %}`, {
      link: variant.link,
      block: {
        id: `harness-${variant.style_class}`,
        settings: {
          style_class: variant.style_class,
          label: variant.label,
          open_in_new_tab: false,
        },
        shopify_attributes: '',
      },
    });
    body += `<section class="case"><h3>${variant.title}</h3>${html}</section>`;
  }

  body += `<section class="case"><h3>DS reference</h3>
    <div class="row">
      <a class="d-btn d-btn-primary theme-label-bold" href="#">Primary</a>
      <a class="d-btn d-btn-outline theme-label-bold" href="#">Outline</a>
      <a class="d-btn d-btn-link theme-label-bold" href="#">Link</a>
    </div>
  </section>`;

  return body;
};
