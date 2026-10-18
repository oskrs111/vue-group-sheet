import { DEFAULT_SHEET_FONT } from './sheetFonts.js'

// The recovered font retains the original legacy encoding, not Unicode letters.
const glyphs = { b: '¨', '♭': '¨', '♯': '#', m: 'Œ', a: '„', j: 'Š', i: '†', sus: '“' }
const available = new Set('#()/135679ABCDEFG¨ŒŠ„†“')

export function getChordSegments(chord, font = DEFAULT_SHEET_FONT) {
  const plain = [{ text: chord, fallback: false, superscript: false }]
  if (font !== DEFAULT_SHEET_FONT) return plain
  const parts = chord.split('/')
  if (parts.some(part => !/^[A-G](?:[#b♯♭])?[^/]*$/u.test(part))) {
    return [{ text: chord, fallback: true, superscript: false }]
  }

  const segments = []
  const append = (text, fallback = false, superscript = false) => {
    const previous = segments.at(-1)
    if (previous && previous.fallback === fallback && previous.superscript === superscript) previous.text += text
    else segments.push({ text, fallback, superscript })
  }
  parts.forEach((part, index) => {
    if (index) append('/')
    const [, root, accidental, suffix] = part.match(/^([A-G])([#b♯♭]?)(.*)$/u)
    append(root + (glyphs[accidental] || accidental))
    for (const token of suffix.match(/sus|./gu) || []) {
      const text = glyphs[token] || token
      const fallback = !available.has(text)
      append(text, fallback, fallback || /^[#b♯♭]$/u.test(token))
    }
  })
  return segments
}
