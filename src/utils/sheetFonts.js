export const DEFAULT_SHEET_FONT = 'Recovered Chords Std'
export const FALLBACK_TEXT_FONT = 'Libre Baskerville'
export const RECOVERED_CHORD_FACE = 'Recovered Chords Std Chords'
export const CHORD_FONT_KEY = Symbol('chordFont')

export function getSheetFont(settings = {}) {
  // Older songs stored separate text/chord choices. Keep their chord choice
  // as the sheet font when migrating to the single selector.
  const font = settings?.chord_font_family || settings?.font_family
  return !font || font === 'Pori Chords Std' ? DEFAULT_SHEET_FONT : font
}

export function normalizeSheetFontSettings(settings = {}) {
  const { chord_font_family, ...rest } = settings || {}
  return { ...rest, font_family: getSheetFont(settings) }
}

export function getSheetFontStyles(settings = {}) {
  const font = getSheetFont(settings)
  const chords = font === DEFAULT_SHEET_FONT ? RECOVERED_CHORD_FACE : font
  return {
    '--sheet-font-family': `"${font}", "${FALLBACK_TEXT_FONT}", serif`,
    '--chord-font-family': `"${chords}", "${FALLBACK_TEXT_FONT}", serif`,
    '--chord-font-weight': font === DEFAULT_SHEET_FONT ? 400 : 700
  }
}
