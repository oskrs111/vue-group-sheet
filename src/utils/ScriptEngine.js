const toBase64 = (value) => {
  try {
    return window.btoa(unescape(encodeURIComponent(value)))
  } catch {
    return ''
  }
}

const fromBase64 = (value) => {
  if (!value) return ''

  try {
    return decodeURIComponent(escape(window.atob(value)))
  } catch {
    return ''
  }
}

const DIV_TO_DOTS = {
  1: '',
  2: '..',
  3: '.',
  5: '...',
}

const DOTS_TO_DIV = {
  '': 1,
  '.': 3,
  '..': 2,
  '...': 5,
}

const SCRIPT_ID_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/

export function generateScript(songData) {
  const { body, structure } = songData
  const lines = []

  lines.push('Sections:')
  for (const section of body) {
    const parts = []

    for (const compass of section.compass) {
      const chords = compass.chords

      if (chords.length === 1 && chords[0].chord === 'R') {
        parts.push('%')
        continue
      }

      if (chords.length === 1 && chords[0].chord === 'S') {
        parts.push('/')
        continue
      }

      parts.push(chords.map((chord) => encodeChord(chord)).join(','))
    }

    let compassText = parts.map((part) => `|${part}|`).join('')
    compassText = compassText.replace(/\|\|/g, '|')

    const turns = section.turns && section.turns > 1 ? `x${section.turns}` : ''
    lines.push(`${section.id}=${compassText}${turns}`)
  }

  lines.push('')
  lines.push('Structure:')
  lines.push(structure.map((item) => item.isBreak ? '/' : item.id).join(','))
  lines.push('')
  lines.push('Lyrics:')

  for (const item of structure) {
    if (item.isBreak) continue
    lines.push(`${item.id}=${fromBase64(item.lyric || '')}`)
  }

  return lines.join('\n')
}

function encodeChord(chord) {
  if (chord.chord === 'REST') {
    const dots = DIV_TO_DOTS[chord.div] ?? ''
    return `_${dots}`
  }

  const dots = DIV_TO_DOTS[chord.div] ?? ''
  return `${chord.chord}${dots}`
}

export function parseScript(script, currentSongData = {}) {
  const blocks = splitBlocks(script)
  const existingSections = {}
  const existingStructure = {}
  const parsedSectionIds = new Set()

  ;(currentSongData.body || []).forEach((section) => {
    existingSections[section.id] = section
  })

  ;(currentSongData.structure || []).forEach((item) => {
    if (!item.isBreak) existingStructure[item.id] = item
  })

  const body = []
  for (const entry of blocks.sections) {
    const match = entry.text.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=(.*)$/)
    if (!match) {
      throw createScriptError('Formato de seccion invalido. Usa ID=|compas1|compas2|', entry.lineNumber)
    }

    const id = match[1].trim()
    const rhs = match[2].trim()

    if (!SCRIPT_ID_REGEX.test(id)) {
      throw createScriptError(`Identificador de seccion invalido: "${id}".`, entry.lineNumber)
    }

    if (parsedSectionIds.has(id)) {
      throw createScriptError(`La seccion "${id}" esta repetida.`, entry.lineNumber)
    }

    const { compasses, turns } = parseSectionRhs(rhs, entry.lineNumber)
    const existing = existingSections[id] || {}

    parsedSectionIds.add(id)

    body.push({
      id,
      b_color: existing.b_color || '#f0f0f0',
      f_color: existing.f_color || '#000000',
      turns,
      compass: compasses,
    })
  }

  const sectionMap = {}
  body.forEach((section) => { sectionMap[section.id] = section })
  ;(currentSongData.body || []).forEach((section) => {
    if (!sectionMap[section.id]) sectionMap[section.id] = section
  })

  const structureTokens = parseStructureTokens(blocks.structure)
  const structure = []
  const structureCounts = {}

  for (const token of structureTokens) {
    if (token.value === '/') {
      structure.push({ isBreak: true })
      continue
    }

    const section = sectionMap[token.value]
    if (!section) {
      throw createScriptError(`La estructura referencia la seccion "${token.value}" que no existe en Sections.`, token.lineNumber)
    }

    const existing = existingStructure[token.value]

    structure.push({
      id: token.value,
      b_color: existing?.b_color || section.b_color || '#f0f0f0',
      f_color: existing?.f_color || section.f_color || '#000000',
      shape: existing?.shape || 'S',
      lyric: existing?.lyric || '',
      isBreak: false,
    })

    structureCounts[token.value] = (structureCounts[token.value] || 0) + 1
  }

  const lyricMap = {}
  for (const entry of blocks.lyrics) {
    if (!sectionMap[entry.id]) {
      throw createScriptError(`Lyrics referencia la seccion "${entry.id}" que no existe en Sections.`, entry.lineNumber)
    }

    if (!structureCounts[entry.id]) {
      throw createScriptError(`Lyrics referencia la seccion "${entry.id}" pero no aparece en Structure.`, entry.lineNumber)
    }

    if (!lyricMap[entry.id]) lyricMap[entry.id] = []

    if (lyricMap[entry.id].length >= structureCounts[entry.id]) {
      throw createScriptError(`Hay mas entradas de Lyrics para "${entry.id}" que apariciones en Structure.`, entry.lineNumber)
    }

    lyricMap[entry.id].push(entry.text)
  }

  const lyricConsumed = {}
  for (const item of structure) {
    if (item.isBreak) continue

    const entries = lyricMap[item.id] || []
    const currentIndex = lyricConsumed[item.id] ?? 0
    const text = entries[currentIndex] ?? ''

    item.lyric = toBase64(text)
    lyricConsumed[item.id] = currentIndex + 1
  }

  return { body, structure }
}

function splitBlocks(script) {
  const blocks = {
    sections: [],
    structure: [],
    lyrics: [],
  }

  const headersSeen = {
    sections: null,
    structure: null,
    lyrics: null,
  }

  let currentBlock = null
  let currentLyricEntry = null

  const finalizeLyricEntry = () => {
    if (!currentLyricEntry) return
    blocks.lyrics.push(currentLyricEntry)
    currentLyricEntry = null
  }

  for (const [index, sourceLine] of script.split('\n').entries()) {
    const rawLine = sourceLine.replace(/\r$/, '')
    const lineNumber = index + 1
    const line = rawLine.trimEnd()
    const trimmed = line.trim()
    const trimmedStart = rawLine.trimStart()

    if (trimmed === 'Sections:' || trimmed === 'Structure:' || trimmed === 'Lyrics:') {
      finalizeLyricEntry()

      if (trimmed === 'Sections:') {
        if (headersSeen.sections) throw createScriptError('El bloque Sections esta repetido.', lineNumber)
        headersSeen.sections = lineNumber
        currentBlock = 'sections'
      } else if (trimmed === 'Structure:') {
        if (headersSeen.structure) throw createScriptError('El bloque Structure esta repetido.', lineNumber)
        headersSeen.structure = lineNumber
        currentBlock = 'structure'
      } else {
        if (headersSeen.lyrics) throw createScriptError('El bloque Lyrics esta repetido.', lineNumber)
        headersSeen.lyrics = lineNumber
        currentBlock = 'lyrics'
      }

      continue
    }

    if (!currentBlock) {
      if (!trimmed) continue
      throw createScriptError('Hay contenido fuera de Sections, Structure o Lyrics.', lineNumber)
    }

    if (currentBlock === 'sections') {
      if (!trimmed) continue
      blocks.sections.push({ text: trimmed, lineNumber })
      continue
    }

    if (currentBlock === 'structure') {
      if (!trimmed) continue
      blocks.structure.push({ text: trimmed, lineNumber })
      continue
    }

    const lyricMatch = trimmedStart.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=(.*)$/)
    if (lyricMatch) {
      finalizeLyricEntry()

      currentLyricEntry = {
        id: lyricMatch[1],
        text: lyricMatch[2],
        lineNumber,
      }
      continue
    }

    if (currentLyricEntry) {
      currentLyricEntry.text += `\n${rawLine}`
      continue
    }

    if (!trimmed) continue

    throw createScriptError('La primera linea de cada entrada en Lyrics debe usar ID=texto.', lineNumber)
  }

  finalizeLyricEntry()

  if (!headersSeen.sections) throw createScriptError('Falta el bloque Sections.', 1)
  if (!headersSeen.structure) throw createScriptError('Falta el bloque Structure.', 1)
  if (!headersSeen.lyrics) throw createScriptError('Falta el bloque Lyrics.', 1)

  return blocks
}

function parseStructureTokens(lines) {
  const tokens = []

  for (const entry of lines) {
    const rawParts = entry.text.split(',')

    for (const rawPart of rawParts) {
      const value = rawPart.trim()

      if (!value) {
        throw createScriptError('Hay un elemento vacio en Structure.', entry.lineNumber)
      }

      if (value !== '/' && !SCRIPT_ID_REGEX.test(value)) {
        throw createScriptError(`Identificador invalido en Structure: "${value}".`, entry.lineNumber)
      }

      tokens.push({
        value,
        lineNumber: entry.lineNumber,
      })
    }
  }

  return tokens
}

function parseSectionRhs(rhs, lineNumber) {
  let turns = 1
  const turnsMatch = rhs.match(/x(\d+)$/)

  if (turnsMatch) {
    turns = parseInt(turnsMatch[1], 10)
    rhs = rhs.slice(0, rhs.length - turnsMatch[0].length).trim()
  }

  if (!rhs) {
    throw createScriptError('La seccion debe incluir al menos un compas.', lineNumber)
  }

  if (!rhs.startsWith('|') || !rhs.endsWith('|')) {
    throw createScriptError('Los compases deben escribirse entre barras verticales.', lineNumber)
  }

  const rawCompasses = rhs.split('|').slice(1, -1)
  if (rawCompasses.length === 0) {
    throw createScriptError('La seccion debe incluir al menos un compas.', lineNumber)
  }

  const compasses = []

  for (const rawCompass of rawCompasses) {
    const compassText = rawCompass.trim()

    if (!compassText) {
      throw createScriptError('Hay un compas vacio en la seccion.', lineNumber)
    }

    if (compassText === '%') {
      compasses.push({ chords: [{ chord: 'R' }] })
      continue
    }

    if (compassText === '/') {
      compasses.push({ chords: [{ chord: 'S' }] })
      continue
    }

    const chordTokens = compassText.split(',').map((token) => token.trim())
    if (chordTokens.some((token) => !token)) {
      throw createScriptError('Hay un acorde vacio dentro de un compas.', lineNumber)
    }

    compasses.push({
      chords: chordTokens.map((token) => parseChordToken(token, lineNumber)),
    })
  }

  return { compasses, turns }
}

function parseChordToken(token, lineNumber) {
  const value = token.trim()

  if (!value) {
    throw createScriptError('Hay un acorde vacio.', lineNumber)
  }

  if (value === '%') return { chord: 'R' }
  if (value === '/') return { chord: 'S' }

  if (value.startsWith('_')) {
    const dots = value.slice(1)
    if (!(dots in DOTS_TO_DIV)) {
      throw createScriptError(`Duracion invalida en el silencio "${value}".`, lineNumber)
    }

    return {
      chord: 'REST',
      div: DOTS_TO_DIV[dots],
    }
  }

  const dotsMatch = value.match(/(\.*)\s*$/)
  const dots = dotsMatch ? dotsMatch[1] : ''
  const chordName = value.slice(0, value.length - dots.length).trim()

  if (!(dots in DOTS_TO_DIV)) {
    throw createScriptError(`Duracion invalida en el acorde "${value}".`, lineNumber)
  }

  if (!chordName) {
    throw createScriptError('Falta el nombre del acorde.', lineNumber)
  }

  if (/[|,]/.test(chordName)) {
    throw createScriptError(`El acorde "${chordName}" contiene caracteres no validos.`, lineNumber)
  }

  return {
    chord: chordName,
    div: DOTS_TO_DIV[dots],
  }
}

function createScriptError(message, lineNumber) {
  const error = new Error(lineNumber ? `Linea ${lineNumber}: ${message}` : message)
  error.lineNumber = lineNumber || null
  return error
}
