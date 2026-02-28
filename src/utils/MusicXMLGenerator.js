/**
 * MusicXMLGenerator.js
 * Utility to convert Vue Group Sheet song data to MusicXML 4.0 format.
 * Includes chord interpretation to real notes and guitar-friendly voicings.
 */

export class MusicXMLGenerator {
  constructor(songData) {
    this.songData = songData
    this.divisions = 4 // Units per quarter note
    this.lastHarmonyXml = ''
    this.lastNotes = []
  }

  generate() {
    const { header, body, structure } = this.songData
    const title = header.center.top.name || 'Sin título'
    const composer = header.center.bottom.author || ''
    const timeSig = header.left.bottom.signature || '4/4'
    const tempo = header.left.top.tempo || '120'
    const [beats, beatType] = timeSig.split('/').map(Number)

    // Flatten structure: expand structure into actual measures
    const flatMeasures = []
    const sectionMap = {}
    body.forEach(section => {
      sectionMap[section.id] = section
    })

    structure.forEach((item, index) => {
      if (item.id && !item.isBreak && sectionMap[item.id]) {
        const section = sectionMap[item.id]
        const rehearsalMarkLabel = `${item.id}${index + 1}`

        section.compass.forEach((measureData, mIdx) => {
          flatMeasures.push({
            ...measureData,
            sectionId: section.id,
            rehearsalMark: mIdx === 0 ? rehearsalMarkLabel : null
          })
        })
      }
    })

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>${this.escapeXml(title)}</work-title>
  </work>
  <identification>
    <creator type="composer">${this.escapeXml(composer)}</creator>
    <encoding>
      <software>Vue Group Sheet</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Guitar</part-name>
    </score-part>
  </part-list>
  <part id="P1">`

    flatMeasures.forEach((measure, mIndex) => {
      xml += `
    <measure number="${mIndex + 1}">`

      // Add rehearsal mark if it's the start of a block (A1, B2, etc.)
      if (measure.rehearsalMark) {
        xml += `
      <direction placement="above">
        <direction-type>
          <rehearsal font-weight="bold">${this.escapeXml(measure.rehearsalMark)}</rehearsal>
        </direction-type>
      </direction>`
      }

      if (mIndex === 0) {
        xml += `
      <attributes>
        <divisions>${this.divisions}</divisions>
        <key>
          <fifths>${this.toneToFifths(header.right.top.tone)}</fifths>
        </key>
        <time>
          <beats>${beats || 4}</beats>
          <beat-type>${beatType || 4}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempo}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${tempo}"/>
      </direction>`
      }

      const totalMeasureDuration = (beats || 4) * this.divisions
      const chordsInMeasure = measure.chords || []

      chordsInMeasure.forEach((chordData, cIndex) => {
        // Map app 'div' to MusicXML duration
        // divisions = 4 means 4 units per quarter note (1 beat)
        let duration = 4 // Default quarter
        switch (chordData.div) {
          case 1: duration = (beats || 4) * this.divisions; break; // Whole
          case 5: duration = 3 * this.divisions; break; // Dotted Half
          case 2: duration = 2 * this.divisions; break; // Half
          case 3:
          case 4: duration = 1 * this.divisions; break; // Quarter
        }

        const type = this.durationToType(duration)
        const chordStr = chordData.chord || ''

        if (chordStr === 'REST') {
          xml += `
      <note>
        <rest/>
        <duration>${duration}</duration>
        <type>${type}</type>
      </note>`
        } else if (chordStr === 'R' || chordStr === '%') {
          // Repetition
          if (this.lastHarmonyXml) {
            xml += this.lastHarmonyXml
            xml += this.generateNoteStack(this.lastNotes, duration, type)
          } else {
            // Fallback to rest if no previous chord
            xml += `
      <note>
        <rest/>
        <duration>${duration}</duration>
        <type>${type}</type>
      </note>`
          }
        } else if (chordStr === 'S') {
          // Space/Break - skip
        } else {
          // Real chord
          const harmony = this.generateHarmony(chordStr)
          this.lastHarmonyXml = harmony
          this.lastNotes = this.interpretChord(chordStr)

          xml += harmony
          xml += this.generateNoteStack(this.lastNotes, duration, type)
        }
      })

      xml += `
    </measure>`
    })

    xml += `
  </part>
</score-partwise>`

    return xml
  }

  generateNoteStack(notes, duration, type) {
    if (!notes || notes.length === 0) return ''
    let noteXml = ''
    notes.forEach((pitch, index) => {
      noteXml += `
      <note>
        ${index > 0 ? '<chord/>' : ''}
        <pitch>
          <step>${pitch.step}</step>
          ${pitch.alter !== 0 ? `<alter>${pitch.alter}</alter>` : ''}
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>${duration}</duration>
        <type>${type}</type>
      </note>`
    })
    return noteXml
  }

  interpretChord(chordStr) {
    // Apoyar C/E o C\E
    const match = chordStr.match(/^([A-G])([#b])?(.*?)(?:[/\\]([A-G][#b]?))?$/)
    if (!match) return []

    const rootBase = match[1]
    const accidental = match[2] || ''
    const suffix = match[3] || ''
    const bassNoteStr = match[4] || null

    const semitonesMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 }
    let rootSemitone = semitonesMap[rootBase]
    if (accidental === '#') rootSemitone += 1
    if (accidental === 'b') rootSemitone -= 1

    // Default intervals
    let intervals = [0, 4, 7] // Major triad

    const isMinor = suffix.includes('m') && !suffix.includes('maj') || suffix.includes('-')
    const isMaj7 = suffix.includes('maj') || suffix.includes('M')
    const isHalfDim = suffix.includes('m7b5') || suffix.includes('-7b5') || suffix.includes('ø')
    const isDim = suffix.includes('dim') || suffix.includes('o') && !isHalfDim
    const isAug = suffix.includes('aug') || suffix.includes('+')

    if (isHalfDim) {
      intervals = [0, 3, 6, 10]
    } else if (isMinor) {
      intervals = [0, 3, 7] // Minor triad
      if (suffix.includes('7')) intervals.push(10) // Minor 7th
    } else if (isMaj7 && suffix.includes('7')) {
      intervals = [0, 4, 7, 11] // Major 7th
    } else if (suffix.includes('7')) {
      intervals = [0, 4, 7, 10] // Dominant 7th
    } else if (isDim) {
      intervals = [0, 3, 6] // Dim triad
      if (suffix.includes('7')) intervals.push(9) // Dim 7th
    } else if (isAug) {
      intervals = [0, 4, 8] // Aug triad
    } else if (suffix.includes('sus4')) {
      intervals = [0, 5, 7]
    } else if (suffix.includes('sus2')) {
      intervals = [0, 2, 7]
    }

    // Add extensions if present
    if (suffix.includes('9')) intervals.push(14)
    if (suffix.includes('11')) intervals.push(17)
    if (suffix.includes('13')) intervals.push(21)

    // Optional bass note logic
    let bassAbsoluteSemitone = null
    if (bassNoteStr) {
      const matchBass = bassNoteStr.match(/^([A-G])([#b])?$/)
      if (matchBass) {
        let bSemi = semitonesMap[matchBass[1]]
        if (matchBass[2] === '#') bSemi += 1
        if (matchBass[2] === 'b') bSemi -= 1
        bassAbsoluteSemitone = bSemi + 36 // Place bass in octave 2 (C2)
      }
    }

    // Convert root + intervals to actual notes in guitar register
    // Guitar register: Octave 3 is a good base for chords
    const chordNotes = intervals.map(interval => {
      const absoluteSemitone = rootSemitone + interval + 48 // Start at C3
      return this.semitoneToPitch(absoluteSemitone)
    })

    if (bassAbsoluteSemitone !== null) {
      chordNotes.unshift(this.semitoneToPitch(bassAbsoluteSemitone)) // Add to bottom
    }

    return chordNotes
  }

  semitoneToPitch(totalSemitones) {
    const steps = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
    const alters = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]

    const octave = Math.floor(totalSemitones / 12)
    const noteIndex = totalSemitones % 12

    return {
      step: steps[noteIndex],
      alter: alters[noteIndex],
      octave: octave
    }
  }

  generateHarmony(chordStr) {
    const match = chordStr.match(/^([A-G])([#b])?(.*?)(?:[/\\]([A-G][#b]?))?$/)
    if (!match) return ''

    const root = match[1]
    const alter = match[2] === '#' ? 1 : (match[2] === 'b' ? -1 : 0)
    const suffix = match[3] || ''
    const bassNoteStr = match[4] || null

    let kind = 'major'

    const isMinor = suffix.includes('m') && !suffix.includes('maj') || suffix.includes('-')
    const isMaj7 = suffix.includes('maj') || suffix.includes('M')
    const isHalfDim = suffix.includes('m7b5') || suffix.includes('-7b5') || suffix.includes('ø')
    const isDim = suffix.includes('dim') || suffix.includes('o') && !isHalfDim
    const isAug = suffix.includes('aug') || suffix.includes('+')

    if (isHalfDim) {
      kind = 'half-diminished'
    } else if (isMinor) {
      kind = suffix.includes('7') ? 'minor-seventh' : 'minor'
    } else if (isMaj7 && suffix.includes('7')) {
      kind = 'major-seventh'
    } else if (suffix.includes('7')) {
      kind = 'dominant'
    } else if (isDim) {
      kind = suffix.includes('7') ? 'diminished-seventh' : 'diminished'
    } else if (isAug) {
      kind = 'augmented'
    } else if (suffix.includes('sus4')) {
      kind = 'suspended-fourth'
    } else if (suffix.includes('sus2')) {
      kind = 'suspended-second'
    }

    let bassXml = ''
    if (bassNoteStr) {
      const matchBass = bassNoteStr.match(/^([A-G])([#b])?$/)
      if (matchBass) {
        const bassRoot = matchBass[1]
        const bassAlter = matchBass[2] === '#' ? 1 : (matchBass[2] === 'b' ? -1 : 0)
        bassXml = `
        <bass>
          <bass-step>${bassRoot}</bass-step>
          ${bassAlter !== 0 ? `<bass-alter>${bassAlter}</bass-alter>` : ''}
        </bass>`
      }
    }

    return `
      <harmony>
        <root>
          <root-step>${root}</root-step>
          ${alter !== 0 ? `<root-alter>${alter}</root-alter>` : ''}
        </root>
        <kind>${kind}</kind>${bassXml}
        <offset>0</offset>
      </harmony>`
  }

  toneToFifths(tone) {
    const map = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
      'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7,
      'Am': 0, 'Em': 1, 'Bm': 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6,
      'Dm': -1, 'Gm': -2, 'Cm': -3, 'Fm': -4, 'Bbm': -5, 'Ebm': -6
    }
    return map[tone] || 0
  }

  durationToType(duration) {
    if (duration >= 16) return 'whole'
    if (duration >= 8) return 'half'
    if (duration >= 4) return 'quarter'
    if (duration >= 2) return 'eighth'
    return '16th'
  }

  escapeXml(unsafe) {
    if (!unsafe) return ''
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    })
  }
}
