import path from 'node:path';
import {pathToFileURL} from 'node:url';

/** Bulma info-light article card parity from a-plt-custom-style.css */
const EXPECTED = {
  borderRadiusPx: 12,
  borderRadiusTolerancePx: 0.6,
  /** hsl(190deg 100% 95%) */
  backgroundRgb: [229, 255, 252],
  backgroundTolerance: 8,
  headerPaddingTopPx: 8,
  headerPaddingLeftPx: 12,
  paddingTolerancePx: 2,
};

function parseRgb(color) {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function near(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

function rgbNear(actual, expected, tolerance) {
  if (!actual || actual.length !== 3) return false;
  return actual.every((c, i) => near(c, expected[i], tolerance));
}

export async function verifyArticleLegacyCard(
  htmlPath,
  {selector = 'article.d-card.plt-legacy-bulma-info-light-card', viewportWidth = 390} = {},
) {
  const {chromium} = await import('playwright');

  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: viewportWidth, height: 900}});
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});

    const result = await page.evaluate((sel) => {
      const article = document.querySelector(sel);
      if (!article) return {ok: false, reason: `missing ${sel}`};
      const header = article.querySelector('header');
      const cardStyle = getComputedStyle(article);
      const headerStyle = header ? getComputedStyle(header) : null;
      return {
        ok: true,
        card: {
          borderTopLeftRadius: cardStyle.borderTopLeftRadius,
          backgroundColor: cardStyle.backgroundColor,
        },
        header: headerStyle
          ? {
              paddingTop: headerStyle.paddingTop,
              paddingLeft: headerStyle.paddingLeft,
            }
          : null,
      };
    }, selector);

    if (!result.ok) {
      throw new Error(result.reason);
    }

    const radius = parseFloat(result.card.borderTopLeftRadius);
    if (Number.isNaN(radius) || !near(radius, EXPECTED.borderRadiusPx, EXPECTED.borderRadiusTolerancePx)) {
      throw new Error(
        `border-radius expected ~${EXPECTED.borderRadiusPx}px, got ${result.card.borderTopLeftRadius}`,
      );
    }

    const bg = parseRgb(result.card.backgroundColor);
    if (!rgbNear(bg, EXPECTED.backgroundRgb, EXPECTED.backgroundTolerance)) {
      throw new Error(
        `background expected ~rgb(${EXPECTED.backgroundRgb.join(',')}), got ${result.card.backgroundColor}`,
      );
    }

    if (result.header) {
      const padTop = parseFloat(result.header.paddingTop);
      const padLeft = parseFloat(result.header.paddingLeft);
      if (!near(padTop, EXPECTED.headerPaddingTopPx, EXPECTED.paddingTolerancePx)) {
        throw new Error(`header padding-top expected ~${EXPECTED.headerPaddingTopPx}px, got ${result.header.paddingTop}`);
      }
      if (!near(padLeft, EXPECTED.headerPaddingLeftPx, EXPECTED.paddingTolerancePx)) {
        throw new Error(
          `header padding-left expected ~${EXPECTED.headerPaddingLeftPx}px, got ${result.header.paddingLeft}`,
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