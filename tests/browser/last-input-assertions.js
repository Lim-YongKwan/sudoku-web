/** Interpret measured DOM facts. Node tests of this function do not prove browser rendering. */
export function lastInputChecks({ expectedIndex, cells = [], viewport, scrollWidth }) {
  const completeBoard = cells.length === 81 && cells.every((cell, index) => cell.index === index);
  const marked = cells.filter(cell => cell.recent);
  return {
    completeBoard,
    markerMatchesState: completeBoard && (expectedIndex === null ? marked.length === 0
      : Number.isInteger(expectedIndex) && expectedIndex >= 0 && expectedIndex < 81
        && marked.length === 1 && marked[0].index === expectedIndex),
    accessibleMarker: completeBoard && cells.every(cell => typeof cell.label === 'string'
      && cell.label.includes('최근 입력') === cell.recent),
    visibleUnderline: marked.every(cell => cell.visible === true && cell.underline === true
      && Number.isFinite(cell.thickness) && cell.thickness >= 1),
    editableNumber: marked.every(cell => !cell.fixed && !cell.disabled && /^[1-9]$/.test(cell.digit)),
    noHorizontalOverflow: Number.isFinite(viewport) && viewport > 0 && Number.isFinite(scrollWidth)
      && scrollWidth > 0 && scrollWidth <= viewport,
  };
}
