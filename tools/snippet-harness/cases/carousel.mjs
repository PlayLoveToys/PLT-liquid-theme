const collectionCard = (title, hue) => `
  <div class="b-card" style="min-width:220px;background:#${hue}">
    <div class="b-card-header"><p class="b-card-header-title">${title}</p></div>
    <div class="b-card-content"><p>Fixture slide for harness</p></div>
  </div>`;

export default async ({engine}) => {
  const slides = [1, 2, 3, 4]
    .map(
      (n) =>
        `<div class="b-carousel-item" style="flex:0 0 85%;max-width:85vw">${collectionCard(`Collection ${n}`, ['fca5a5', '86efac', '93c5fd', 'fde68a'][n - 1])}</div>`,
    )
    .join('');

  const html = await engine.parseAndRender(
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

  return `<section class="case">
    <h3>DS Carousel shell + plt-carousel.js (3s autoplay, overlay nav)</h3>
    <div class="b-carousel-wrapper" style="max-width:480px;margin:auto">${html}</div>
    <p class="hint">Desktop ≥1152px: grid sin autoplay. Reducir viewport para probar swipe y flechas.</p>
  </section>`;
};