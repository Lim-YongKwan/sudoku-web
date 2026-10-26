/** Pure interpretation of measured DOM facts; tests do not substitute for DOM observations. */
export function layoutChecks(facts) {
  return {
    noHorizontalOverflow: Number.isFinite(facts.viewport) && facts.viewport > 0
      && Number.isFinite(facts.scrollWidth) && facts.scrollWidth > 0 && facts.scrollWidth <= facts.viewport,
    squareCell: Number.isFinite(facts.cellWidth) && Number.isFinite(facts.cellHeight)
      && facts.cellWidth > 0 && facts.cellHeight > 0 && Math.abs(facts.cellWidth - facts.cellHeight) <= 1,
    boxRightThick: facts.boxRightWidth === '3px',
    boxBottomThick: facts.boxBottomWidth === '3px',
  };
}

export function allChecksPass(checks) {
  const values = Object.values(checks);
  return values.length > 0 && values.every((value) => value === true);
}