export const SCORE_COLUMNS = 12

export function getBreakGroups(compasses) {
  const groups = []
  let current = []
  compasses.forEach((compass, index) => {
    if (compass.chords.length === 1 && compass.chords[0].chord === 'S') {
      current.push(index)
      groups[index] = current
    } else current = []
  })
  return groups
}

export function getCompassPlacement(chordCount, contentWidth, gridWidth, frameWidth = 12) {
  const baseSpan = Math.max(1, Math.min(chordCount || 1, SCORE_COLUMNS))
  if (gridWidth <= 0) return { span: baseSpan, scale: 1 }
  const requiredWidth = contentWidth + frameWidth
  const span = Math.min(SCORE_COLUMNS, Math.max(baseSpan, Math.ceil(requiredWidth / (gridWidth / SCORE_COLUMNS))))
  const availableWidth = Math.max(0, gridWidth * span / SCORE_COLUMNS - frameWidth)
  return { span, scale: contentWidth > availableWidth ? availableWidth / contentWidth : 1 }
}

export function layoutScoreGrids(root) {
  for (const grid of root.querySelectorAll('.score-compass-grid')) {
    const gridWidth = parseFloat(getComputedStyle(grid).width) || grid.clientWidth
    if (!gridWidth) continue
    for (const cell of grid.children) {
      const compass = cell.querySelector('.score-compass')
      const content = compass?.querySelector('.chords-display, .repeat-symbol')
      if (!content) continue
      const style = getComputedStyle(compass)
      const frameWidth = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
        .reduce((width, property) => width + (parseFloat(style[property]) || 0), 0)
      const { span, scale } = getCompassPlacement(
        Number(cell.dataset.chordCount), parseFloat(getComputedStyle(content).width) || content.offsetWidth, gridWidth, frameWidth
      )
      cell.style.setProperty('--score-span', span)
      cell.style.setProperty('--score-content-scale', scale)
    }
  }
}

export async function prepareScoreExport(root) {
  if (document.fonts?.ready) await document.fonts.ready
  layoutScoreGrids(root)
}
