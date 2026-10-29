import type { GameState } from '../types.js';
import { getDigitStock } from '../core/digit-stock.js';

/** Derived presentation only; stock never disables a digit or changes board focus. */
export function renderDigitStock(scope: HTMLElement, state: GameState) {
  const stock = state.assistance.showDigitStock ? getDigitStock(state.values) : null;
  for (const button of scope.querySelectorAll<HTMLButtonElement>('[data-digit]')) {
    const digit = Number(button.dataset.digit);
    const item = stock?.find(item => item.digit === digit);
    button.classList.toggle('is-stock-exhausted', item?.exhausted ?? false);
    if (item) {
      button.setAttribute('data-stock-remaining', String(item.remaining));
      button.setAttribute('aria-label', '숫자 ' + digit + ' 입력, 사용 ' + item.usedCount + '개, 남은 스톡 ' + item.remaining + '개');
    } else {
      button.removeAttribute('data-stock-remaining');
      button.setAttribute('aria-label', '숫자 ' + digit + ' 입력');
    }
  }
  const help = scope.querySelector<HTMLElement>('[data-stock-help]');
  if (help) help.hidden = !state.assistance.showDigitStock;
}
