const header_content = {
  h1: [{language: 'en-US', value: 'Sanity collection hero'}],
  subtitle: [{language: 'en-US', value: 'Subtitle from CMS'}],
  intro: [{language: 'en-US', value: '<p>Expandable intro from Sanity metafield.</p>'}],
};

export default async ({engine}) => {
  engine.registerFilter('image_url', (src) => (src ? 'https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?v=1' : ''));
  engine.registerFilter('image_tag', () => '<img src="https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?v=1" alt="Hero" width="600" height="400">');

  const html = await engine.parseAndRender(
    `{% render '_collection-hero-collapsable-content', header_content: header_content %}`,
    {
      header_content,
      section: {id: 'harness-collection-hero'},
      collection: {
        title: 'Harness collection',
        featured_image: 'hero.jpg',
      },
      localization: {language: {iso_code: 'en'}, country: {iso_code: 'US'}},
    },
  );
  return `<section class="case"><h3>_collection-hero-collapsable-content</h3>${html}</section>`;
};