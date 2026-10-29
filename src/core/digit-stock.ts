import type { Board } from '../types.js';
import { assertBoard } from './board.js';

/** Usage only: includes clues already present in values; never checks the solution. */
export function getDigitStock(values: Board | null) {
  if (values !== null) assertBoard(values);
  const counts = Array<number>(10).fill(0);
  for (const digit of values ?? []) if (digit !== 0) counts[digit]++;
  return Array.from({ length: 9 }, (_, index) => {
    const digit = index + 1, usedCount = counts[digit];
    return { digit, usedCount, remaining: Math.max(0, 9 - usedCount), exhausted: usedCount >= 9 };
  });
}
