/** Interpret browser measurements. Pure tests do not prove actual font rendering. */
export function typographyChecks({ mode, pairs = [], digitCount, noteCount, textWithinCells, expectedLock }) {
  const hasDigits = mode !== 'generating';
  const modes = ['playing', 'conflict', 'generating', 'completed'];
  const completePairs = pairs.length === 9 && pairs.every((pair, index) => pair.clueDigit === String(index + 1) && pair.entryDigit === pair.clueDigit);
  return {
    knownMode: modes.includes(mode),
    expectedContent: digitCount === (mode === 'completed' ? 81 : hasDigits ? 18 : 0) && noteCount === (hasDigits && mode !== 'completed' ? 9 : 0),
    sameDigitSamples: hasDigits ? completePairs : pairs.length === 0,
    sharedTypography: !hasDigits || completePairs && pairs.every(pair =>
      typeof pair.clueFont === 'string' && pair.clueFont.length > 0 && pair.clueFont === pair.entryFont
      && Number.isFinite(pair.clueSize) && pair.clueSize > 0 && pair.clueSize === pair.entrySize
      && Number.isFinite(pair.clueLineHeight) && pair.clueLineHeight > 0 && pair.clueLineHeight === pair.entryLineHeight
      && pair.clueAlign === 'center' && pair.entryAlign === 'center'),
    readableWeightGap: !hasDigits || completePairs && pairs.every(pair =>
      Number.isFinite(pair.entryWeight) && pair.entryWeight >= 600
      && Number.isFinite(pair.clueWeight) && pair.clueWeight >= pair.entryWeight && pair.clueWeight - pair.entryWeight <= 100),
    clueBackgroundDistinct: !hasDigits || completePairs && pairs.every(pair =>
      typeof pair.clueBackground === 'string' && pair.clueBackground.length > 0 && pair.clueBackground !== pair.entryBackground),
    textWithinCells: textWithinCells === true,
    expectedLock: expectedLock === true,
  };
}
