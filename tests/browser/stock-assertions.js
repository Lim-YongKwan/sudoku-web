/** Interpret measured DOM facts; pure tests do not replace browser observation. */
export function stockPresentationChecks({ enabled, playing, expectedCounts = [], buttons = [], helpHidden, checkboxCount, checkboxChecked, checkboxDisabled, checkboxLabeled, viewport, scrollWidth }) {
  const countsValid = expectedCounts.length === 9 && expectedCounts.every(n => Number.isInteger(n) && n >= 0 && n <= 81)
    && expectedCounts.reduce((sum, n) => sum + n, 0) <= 81;
  const completePad = buttons.length === 9 && buttons.every((button, index) => button.digit === index + 1);
  const usable = completePad && countsValid;
  return {
    completePad, countsValid,
    classes: usable && buttons.every((button, i) => button.exhausted === (enabled && expectedCounts[i] >= 9)),
    remaining: usable && buttons.every((button, i) => button.remaining === (enabled ? String(Math.max(0, 9 - expectedCounts[i])) : null)),
    labels: usable && buttons.every((button, i) => button.label === (enabled
      ? '숫자 ' + (i + 1) + ' 입력, 사용 ' + expectedCounts[i] + '개, 남은 스톡 ' + Math.max(0, 9 - expectedCounts[i]) + '개'
      : '숫자 ' + (i + 1) + ' 입력')),
    inputLocks: completePad && buttons.every(button => button.disabled === !playing),
    stockCaptions: completePad && buttons.every(button => button.captionVisible === enabled),
    contentFits: completePad && buttons.every(button => button.visible === true
      && [button.clientWidth, button.clientHeight, button.scrollWidth, button.scrollHeight].every(n => Number.isFinite(n) && n > 0)
      && button.scrollWidth <= button.clientWidth + 1 && button.scrollHeight <= button.clientHeight + 1),
    help: helpHidden === !enabled,
    toggle: checkboxCount === 1 && checkboxChecked === enabled && checkboxDisabled === !playing && checkboxLabeled === true,
    noHorizontalOverflow: Number.isFinite(viewport) && viewport > 0 && Number.isFinite(scrollWidth) && scrollWidth > 0 && scrollWidth <= viewport,
  };
}
