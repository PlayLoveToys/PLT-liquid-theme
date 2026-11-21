/**
 * Layout helpers for Dawn flex grids vs Tailwind CSS grids in harness verify().
 */

export function countFlexRows(items) {
  const rows = new Map();
  for (const {top, left, width} of items) {
    const key = Math.round(top);
  if (!rows.has(key)) rows.set(key, []);
  rows.get(key).push({left, width});
  }
  return [...rows.values()].sort((a, b) => a[0].left - b[0].left);
}

export function countDistinctTops(items, tolerance = 4) {
  const tops = [];
  for (const {top} of items) {
    const match = tops.find((t) => Math.abs(t - top) <= tolerance);
    if (match === undefined) tops.push(top);
  }
  return tops.length;
}

export function itemsPerRowEstimate(items) {
  if (items.length === 0) return 0;
  const firstTop = items[0].top;
  return items.filter((it) => Math.abs(it.top - firstTop) <= 6).length;
}