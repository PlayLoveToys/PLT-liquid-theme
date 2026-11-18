import path from 'node:path';
import {pathToFileURL} from 'node:url';

/**
 * Desktop grid parity: each slide ≈ 25% of the track (Bulma @1152px), not content-shrink or full-row.
 */
export async function verifyCarouselSlides(htmlPath, {track, slide, viewportWidth = 1280}) {
  let chromium;
  try {
    ({chromium} = await import('playwright'));
  } catch {
    throw new Error(
      'verify-carousel-slides: install playwright (npm i -D playwright) or run npx playwright install chromium',
    );
  }

  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: viewportWidth, height: 900}});
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});

    const result = await page.evaluate(
      ({trackSel, slideSel}) => {
        const trackEl = document.querySelector(trackSel);
        if (!trackEl) return {ok: false, reason: `missing track: ${trackSel}`};
        const slides = [...trackEl.querySelectorAll(`:scope > ${slideSel}`)];
        if (slides.length === 0) return {ok: false, reason: `no slides: ${slideSel}`};

        const trackWidth = trackEl.getBoundingClientRect().width;
        const measures = slides.map((el, i) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            index: i,
            width: rect.width,
            ratio: trackWidth > 0 ? rect.width / trackWidth : 0,
            flex: style.flex,
            maxWidth: style.maxWidth,
          };
        });

        return {ok: true, trackWidth, measures};
      },
      {trackSel: track, slideSel: slide},
    );

    if (!result.ok) {
      throw new Error(result.reason);
    }

    const minRatio = 0.2;
    const maxRatio = 0.3;
    const minPx = 180;
    const maxPx = 360;

    for (const m of result.measures) {
      if (m.width < minPx || m.width > maxPx) {
        throw new Error(
          `slide ${m.index}: width ${m.width.toFixed(1)}px outside [${minPx}, ${maxPx}] (track ${result.trackWidth.toFixed(1)}px)`,
        );
      }
      if (m.ratio < minRatio || m.ratio > maxRatio) {
        throw new Error(
          `slide ${m.index}: ${(m.ratio * 100).toFixed(1)}% of track outside ~25% band (width ${m.width.toFixed(1)}px, flex ${m.flex})`,
        );
      }
    }

    return result;
  } finally {
    await browser.close();
  }
}

export function harnessOutPath(root, caseName) {
  return path.join(root, 'tools', 'snippet-harness', '.out', `${caseName}.html`);
}