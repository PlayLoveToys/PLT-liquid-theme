/** b-carousel block markup: plt-carousel-track + carousel-item @ 1280px. */
import {harnessOutPath, verifyCarouselSlides} from '../lib/verify-carousel-slides.mjs';

export default async ({engine}) => {
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return (
      source.src ||
      'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png'
    );
  });
  engine.registerFilter('image_tag', (url) =>
    `<img src="${url}" alt="" loading="lazy" class="plt-collection-carousel-card__img">`,
  );

  const block = {
    shopify_attributes: '',
    settings: {
      collection: {
        title: 'Harness Collection',
        description: '<p>Short description.</p>',
        featured_image: {
          alt: 'Collection',
          src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png',
        },
        url: '/collections/harness',
      },
      show_description: true,
      truncatewords: 12,
      cta_text: 'Shop Collection',
      cta_url: '/collections/harness',
      priority: false,
    },
  };

  const card = await engine.parseAndRender(`{% render 'c-card-collection', block: block %}`, {block});

  const slides = [1, 2, 3, 4]
    .map(
      () => `<div class="col-span-6 md:col-span-3 carousel-item">${card}</div>`,
    )
    .join('');

  const carousel = await engine.parseAndRender(
    `{% render 'ds-carousel',
      slides: slides,
      interval_ms: 3500,
      nav_overlay: true,
      track_class: 'plt-carousel-track',
      prev_label: 'Previous slide',
      next_label: 'Next slide'
    %}`,
    {slides},
  );

  return `<section class="case" id="zone-b-carousel-desktop">
    <h3>b-carousel block (plt-carousel-track)</h3>
    <div class="carousel-wrapper relative col-span-6 md:col-span-3" style="max-width:1280px;margin:0 auto;padding:1rem">
      ${carousel}
    </div>
  </section>`;
};

export async function verify({root}) {
  await verifyCarouselSlides(harnessOutPath(root, 'b-carousel-desktop'), {
    track: '.plt-carousel__track.plt-carousel-track',
    slide: '.carousel-item',
  });
}