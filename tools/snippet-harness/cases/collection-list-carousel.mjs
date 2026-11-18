/** Real collection-list slide markup (card-collection + ds-carousel @ 1280px). */
import {harnessOutPath, verifyCarouselSlides} from '../lib/verify-carousel-slides.mjs';

const SECTION_ID = 'harness-collection-list';

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
    `<img src="${url}" alt="" loading="lazy" class="h-full w-full object-cover">`,
  );

  const collections = [1, 2, 3, 4].map((n) => ({
    title: `Collection ${n}`,
    url: `/collections/c-${n}`,
    featured_image: {
      alt: `Collection ${n}`,
      src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png',
    },
  }));

  let slides = '';
  for (let i = 0; i < collections.length; i += 1) {
    const card = await engine.parseAndRender(
      `{% render 'card-collection', card_collection: card_collection %}`,
      {card_collection: collections[i]},
    );
    slides += `<div
      id="Slide-${SECTION_ID}-${i + 1}"
      class="b-carousel-item slide-${SECTION_ID} shrink-0 snap-start"
    >${card}</div>`;
  }

  const carousel = await engine.parseAndRender(
    `{% render 'ds-carousel',
      slides: slides,
      interval_ms: 3000,
      nav_overlay: true,
      track_class: 'b-carousel',
      prev_label: 'Previous slide',
      next_label: 'Next slide'
    %}`,
    {slides},
  );

  return `<section class="case section-collection-list" id="zone-collection-list-carousel">
    <h3>collection-list carousel (real markup)</h3>
    <div class="relative w-full" style="max-width:1280px;margin:0 auto;padding:1rem">${carousel}</div>
  </section>`;
};

export async function verify({root}) {
  await verifyCarouselSlides(harnessOutPath(root, 'collection-list-carousel'), {
    track: '.plt-carousel__track.b-carousel',
    slide: '.b-carousel-item',
  });
}