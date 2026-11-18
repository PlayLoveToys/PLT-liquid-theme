/**
 * Scroll, autoplay, and swipe for DS Carousel shells (data-plt-carousel).
 * Parity with the former Alpine carousel() plugin in alpine-bundle.js.
 */
;(() => {
  const DESKTOP_BP = 1152;
  const SWIPE_THRESHOLD = 50;

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BP;
  }

  function slideElements(track) {
    return [...track.children].filter((el) => el.nodeType === 1);
  }

  function scrollToIndex(track, slides, index) {
    const slide = slides[index];
    if (!slide) return;
    const left =
      slide.getBoundingClientRect().left -
      track.getBoundingClientRect().left +
      track.scrollLeft;
    track.scrollTo({ left, behavior: 'smooth' });
  }

  function nearestIndex(track, slides) {
    if (!slides.length) return 0;
    const trackLeft = track.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.getBoundingClientRect().left - trackLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }

  function initRoot(root) {
    const track =
      root.querySelector('[data-plt-carousel-track]') || root.querySelector('.plt-carousel__track');
    if (!track) return;

    const slides = slideElements(track);
    const prevBtn = root.querySelector('[data-plt-carousel-prev]');
    const nextBtn = root.querySelector('[data-plt-carousel-next]');
    const intervalMs = Number.parseInt(root.dataset.pltCarouselInterval || '0', 10) || 0;

    let current = 0;
    let autoplayTimer = null;
    let paused = false;
    let touchStartX = null;
    let touchEndX = null;

    const syncIndex = () => {
      current = nearestIndex(track, slides);
    };

    const go = (delta) => {
      if (!slides.length) return;
      syncIndex();
      if (delta < 0) {
        current = current > 0 ? current - 1 : slides.length - 1;
      } else {
        current = current < slides.length - 1 ? current + 1 : 0;
      }
      scrollToIndex(track, slides, current);
    };

    const clearAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const startAutoplay = () => {
      clearAutoplay();
      if (!intervalMs || isDesktop()) return;
      autoplayTimer = setInterval(() => {
        if (!paused) go(1);
      }, intervalMs);
    };

    const pause = () => {
      paused = true;
      clearAutoplay();
    };

    const resume = () => {
      paused = false;
      startAutoplay();
    };

    prevBtn?.addEventListener('click', () => go(-1));
    nextBtn?.addEventListener('click', () => go(1));

    track.addEventListener(
      'touchstart',
      (event) => {
        pause();
        touchStartX = event.touches[0]?.clientX ?? null;
        touchEndX = null;
      },
      { passive: true },
    );

    track.addEventListener(
      'touchmove',
      (event) => {
        touchEndX = event.touches[0]?.clientX ?? null;
      },
      { passive: true },
    );

    track.addEventListener(
      'touchend',
      () => {
        if (touchStartX != null && touchEndX != null) {
          const delta = touchStartX - touchEndX;
          if (delta > SWIPE_THRESHOLD) go(1);
          else if (delta < -SWIPE_THRESHOLD) go(-1);
        }
        touchStartX = null;
        touchEndX = null;
        resume();
      },
      { passive: true },
    );

    const onResize = () => {
      if (isDesktop()) pause();
      else if (!paused) startAutoplay();
    };
    window.addEventListener('resize', onResize);

    if (intervalMs > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) resume();
            else pause();
          });
        },
        { threshold: 0.1 },
      );
      observer.observe(root);
    }

    startAutoplay();
  }

  function scan() {
    document.querySelectorAll('[data-plt-carousel]').forEach(initRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
})();