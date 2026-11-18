/** Carousel collection card + desktop slide width (1152px harness viewport). */
export default async ({engine}) => {
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return (
      source.src ||
      'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png'
    );
  });
  engine.registerFilter('image_tag', (url) => `<img src="${url}" alt="" loading="lazy" class="plt-collection-carousel-card__img">`);

  const collection = {
    title: 'Harness Collection',
    description: '<p>Short description for carousel card height fixture.</p>',
    featured_image: {
      alt: 'Collection',
      src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png',
    },
    url: '/collections/harness',
  };

  const block = {
    shopify_attributes: '',
    settings: {
      collection,
      show_description: true,
      truncatewords: 12,
      cta_text: 'Shop Collection',
      cta_url: '/collections/harness',
      priority: false,
    },
  };

  const card = await engine.parseAndRender(`{% render 'c-card-collection', block: block %}`, {
    block,
  });

  const slides = `
    <div class="b-carousel-item slide-harness" id="harness-slide-1">${card}</div>
    <div class="b-carousel-item slide-harness" id="harness-slide-2">${card}</div>
    <div class="b-carousel-item slide-harness" id="harness-slide-3">${card}</div>
    <div class="b-carousel-item slide-harness" id="harness-slide-4">${card}</div>
  `;

  const carousel = await engine.parseAndRender(
    `{% render 'ds-carousel',
      slides: slides,
      interval_ms: 0,
      nav_overlay: true,
      track_class: 'b-carousel',
      prev_label: 'Previous',
      next_label: 'Next'
    %}`,
    {slides},
  );

  return `<section class="case" id="zone-carousel-collection-card">
    <h3>c-card-collection + ds-carousel (desktop 25% slide target)</h3>
    <div class="b-carousel-wrapper" style="max-width:1280px;margin:0 auto;padding:1rem">${carousel}</div>
    <p class="hint">At viewport ≥1152px, first .b-carousel-item should be ~25% of track (Bulma grid).</p>
  </section>`;
};