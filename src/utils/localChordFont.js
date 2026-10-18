import recoveredFontUrl from '../asset/fonts/RecoveredChordsStd-Regular.ttf'
import recoveredFontLicense from '../asset/fonts/RecoveredChordsStd-OFL.txt?raw'
import { DEFAULT_SHEET_FONT, RECOVERED_CHORD_FACE } from './sheetFonts'

export const localChordFont = {
  family: DEFAULT_SHEET_FONT,
  url: recoveredFontUrl,
  filename: 'recovered-chords.ttf',
  format: 'truetype',
  license: recoveredFontLicense
}

export function chordFontFace(url = localChordFont.url) {
  const face = `src: url('${url}') format('${localChordFont.format}'); font-weight: 400; font-style: normal; font-display: block;`
  // The digits are superscripts and '%' is a 6/9 chord glyph. Exclude those
  // and the legacy symbol slots from prose while retaining the full chord face.
  return `@font-face { font-family: '${localChordFont.family}'; ${face} unicode-range: U+0028-0029, U+002F, U+0041-0047; }
@font-face { font-family: '${RECOVERED_CHORD_FACE}'; ${face} }`
}

export function registerLocalChordFont() {
  const style = document.createElement('style')
  style.textContent = chordFontFace()
  document.head.append(style)
}
