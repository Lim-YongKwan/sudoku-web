/** Read-only interpretation of browser measurements; Node tests do not verify real rendering. */
export function matchingToggleCheck({ count, checked, disabled, labeled, enabled, playing }) {
  return count === 1 && checked === enabled && disabled === !playing && labeled === true;
}
export function matchingChecks({ expectedIndices = [], cells = [], toggle }) {
  const complete = cells.length === 81 && cells.every((cell, i) => cell.index === i);
  const expected = new Set(expectedIndices);
  return {
    matchingBoardComplete: complete,
    matchingCells: complete && cells.every(cell => cell.matching === expected.has(cell.index)),
    matchingLabels: complete && cells.every(cell => typeof cell.label === 'string'
      && cell.label.includes('선택한 숫자와 같음') === expected.has(cell.index)),
    matchingVisible: complete && cells.every(cell => !expected.has(cell.index) || cell.visible === true),
    matchingToggle: matchingToggleCheck(toggle),
  };
}
