// Fixtures for snippets/article-card.liquid → Dawn card shell + DS d-badge (blog label).
export default async ({engine}) => {
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return source.src || source.url || '';
  });
  engine.registerFilter('time_tag', (value) => `<time datetime="${value}">Nov 12, 2026</time>`);
  engine.registerFilter('truncate', (value, length = 50) => {
    const text = String(value ?? '');
    return text.length > length ? `${text.slice(0, length)}…` : text;
  });
  engine.registerFilter('truncatewords', (value, count = 50) => {
    const words = String(value ?? '')
      .split(/\s+/)
      .filter(Boolean);
    return words.length > count ? `${words.slice(0, count).join(' ')}…` : words.join(' ');
  });
  engine.registerFilter('strip_html', (value) =>
    String(value ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

  const article = {
    id: 42,
    title: 'How we pick materials for intimate toys',
    url: '/blogs/news/how-we-pick-materials',
    author: 'Play Love Toys',
    published_at: '2026-11-12',
    excerpt: 'A short look at body-safe materials and why we care about certifications.',
    content: '',
    comments_count: 3,
    blog: {title: 'News', url: '/blogs/news'},
    image: {
      src: {
        width: 1200,
        alt: 'Article cover',
      },
      width: 1200,
      height: 800,
      aspect_ratio: 1.5,
    },
  };

  // image_url is called on article.image.src in the snippet.
  article.image.src.src =
    'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';

  const data = {
    settings: {
      blog_card_style: 'standard',
      blog_card_color_scheme: 'scheme-1',
      badge_position: 'bottom left',
      page_width: 1200,
      color_schemes: {scheme_1: {}},
    },
    blog: {comments_enabled: true, title: 'News'},
    section: {settings: {media_height: 'adapt'}},
    article,
  };

  const withBadge = await engine.parseAndRender(
    `{% render 'article-card',
      blog: blog,
      article: article,
      show_image: true,
      show_date: true,
      show_author: true,
      show_badge: true,
      show_excerpt: true,
      media_aspect_ratio: 1.5
    %}`,
    data,
  );

  const withoutBadge = await engine.parseAndRender(
    `{% render 'article-card',
      blog: blog,
      article: article,
      show_image: true,
      show_date: true,
      show_author: true,
      show_badge: false,
      media_aspect_ratio: 1.5
    %}`,
    data,
  );

  const pageBadge = `
    <div class="article-card-wrapper card-wrapper underline-links-hover" style="width:16rem">
      <div class="card card--card card--text ratio" style="--ratio-percent: 100%;">
        <div class="card__content">
          <div class="card__information">
            <h3 class="card__heading">
              <a href="/pages/shipping" class="full-unstyled-link">Shipping policy</a>
            </h3>
          </div>
          <div class="card__badge bottom left">
            <span class="d-badge theme-label-bold">Page</span>
          </div>
        </div>
      </div>
    </div>`;

  const dsReference = `
    <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
      <span class="d-badge theme-label-bold">Blog</span>
      <span class="d-badge theme-label-bold">Page</span>
      <span class="d-badge d-badge-secondary theme-label-bold">Sale</span>
    </div>`;

  const cell = (html) =>
    `<div class="harness-article-card-cell" style="width:18rem;max-width:100%">${html}</div>`;

  return `
    <section class="case"><h3>Article card — with blog badge</h3>
      <div class="row">${cell(withBadge)}</div></section>
    <section class="case"><h3>Article card — without badge</h3>
      <div class="row">${cell(withoutBadge)}</div></section>
    <section class="case"><h3>Search page result badge (main-search markup)</h3>
      <div class="row">${cell(pageBadge)}</div></section>
    <section class="case"><h3>DS d-badge reference</h3>${dsReference}</section>`;
};
