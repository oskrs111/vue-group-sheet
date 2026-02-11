<template>
  <div class="epub-page-wrapper">
    <div class="epub-sheet-page" :class="pageClass" :style="{ fontFamily: fontFamily }">
      <!-- Header -->
      <header class="epub-header">
        <div class="header-left">
          <div class="tempo">{{ sheetData.header.left.top.tempo }} BPM</div>
          <div class="signature">{{ sheetData.header.left.bottom.signature }}</div>
        </div>
        <div class="header-center">
          <h1 class="song-title">{{ sheetData.header.center.top.name || 'Sin Título' }}</h1>
          <div class="song-author">{{ sheetData.header.center.bottom.author }}</div>
        </div>
        <div class="header-right">
          <div class="tone">{{ sheetData.header.right.top.tone }}</div>
        </div>
      </header>

      <!-- Body (Sections) -->
      <main class="epub-body">
        <div class="sections-wrapper">
          <section 
            v-for="(section, sIndex) in sheetData.body" 
            :key="sIndex"
            class="epub-section"
            :style="{ 
              backgroundColor: section.b_color, 
              color: section.f_color,
              '--section-text-color': section.f_color 
            }"
          >
            <div class="section-id-container">
              <span class="section-id" :style="{ color: section.f_color }">{{ section.id }}</span>
            </div>
            
            <div class="section-content">
              <div class="compass-container">
                <template v-for="(compass, cIndex) in section.compass" :key="cIndex">
                  <!-- Normal/Repeat Compass -->
                  <div 
                    v-if="!isSpaceCompass(compass)"
                    class="epub-compass"
                  >
                    <!-- Repeat Symbol -->
                    <div v-if="isRepeatCompass(compass)" class="repeat-symbol">%</div>
                    
                    <!-- Chords -->
                    <div v-else class="chords-display">
                      <div v-for="(chord, chIndex) in compass.chords" :key="chIndex" class="epub-chord">
                        <div class="duration-symbol">{{ getDurationSymbol(chord) }}</div>
                        <div class="chord-note">
                          <span 
                            v-for="(char, charIndex) in getChordChars(chord)" 
                            :key="charIndex"
                            :class="{ 'large-char': isLargeChar(chord, charIndex) }"
                          >
                            {{ char }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Break Compass -->
                  <template v-else>
                    <div class="epub-break-filler"></div>
                    <div class="epub-break-force"></div>
                  </template>
                </template>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- Structure -->
      <aside class="epub-structure" v-if="sheetData.structure && sheetData.structure.length > 0">
        <h3>Estructura</h3>
        <div class="structure-items">
          <template v-for="(item, index) in sheetData.structure" :key="index">
            <!-- Standard Item -->
            <div 
              v-if="!item.isBreak"
              class="structure-item"
              :style="{ 
                backgroundColor: item.b_color, 
                color: item.f_color,
                borderRadius: item.shape === 'C' ? '50%' : '0'
              }"
            >
              <span class="item-id">{{ item.id }}</span>
            </div>

            <!-- Break Item: Filler + Force Line -->
            <template v-else>
              <div class="structure-break-filler"></div>
              <div class="structure-break-force"></div>
            </template>
          </template>
        </div>
      </aside>

      <!-- Notes -->
      <footer class="epub-notes" v-if="sheetData.settings.show_notes && sheetData.notes && sheetData.notes.length > 0">
        <h3>Notas</h3>
        <div class="notes-list">
          <div v-for="(note, index) in sheetData.notes" :key="index" class="note-line">
            {{ note.text }}
          </div>
        </div>
      </footer>

      <!-- Lyrics -->
      <section class="epub-lyrics" v-if="sheetData.settings.show_lyrics && hasLyrics">
        <h3>Letra</h3>
        <div class="lyrics-list">
          <template v-for="(item, index) in sheetData.structure" :key="index">
            <div 
              v-if="!item.isBreak"
              class="lyric-line-wrapper"
            >
             <div class="lyric-id" :style="{ color: item.f_color }">{{ item.id }}</div>
             <div class="lyric-text">{{ getLyricText(item.lyric) || '...' }}</div>
          </div>
      </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sheetData: {
    type: Object,
    required: true
  }
})

// Computed properties for page style
const pageClass = computed(() => {
  return props.sheetData.settings.page_orientation === 'V' ? 'page-vertical' : 'page-horizontal'
})

const fontFamily = computed(() => {
  return props.sheetData.settings.font_family || "Libre Baskerville"
})

// Helper functions for Compass/Chords
const isRepeatCompass = (compass) => {
  return compass.chords.length === 1 && compass.chords[0].chord === 'R'
}

const isSpaceCompass = (compass) => {
  return compass.chords.length === 1 && compass.chords[0].chord === 'S'
}

const getChordChars = (chord) => {
  const chordString = chord.chord || ''
  return chordString.split('')
}

const isLargeChar = (chord, index) => {
  const chordString = chord.chord || ''
  if (index === 0) return true
  const slashIndex = chordString.indexOf('/')
  if (slashIndex !== -1 && (index === slashIndex || index === slashIndex + 1)) {
    return true
  }
  return false
}

const getDurationSymbol = (chord) => {
  if (chord.chord === 'R') return '𝄽'
  switch (chord.div) {
    case 1: return ''
    case 2: return '♩♩'
    case 3: return '♩'
    case 4: return '♩'
    default: return '♩'
  }
}

// Lyrics Helpers
const hasLyrics = computed(() => {
  return props.sheetData.structure && props.sheetData.structure.some(item => item.lyric && item.lyric.length > 0)
})

const getLyricText = (b64) => {
  if (!b64) return ''
  try {
    return decodeURIComponent(escape(window.atob(b64)))
  } catch (e) {
    return ''
  }
}
</script>

<style scoped>
/* Base Styles for EPUB compatibility */
.epub-page-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #fff;
}

.epub-sheet-page {
  background: white;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

/* Header */
.epub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.header-left, .header-right {
  min-width: 80px;
}

.header-center {
  text-align: center;
  flex: 1;
}

.tempo { font-size: 1.2em; font-weight: bold; }
.signature { font-size: 1.2em; font-weight: bold; text-align: center; }
.song-title { font-size: 1.8em; margin: 0; font-weight: bold; }
.song-author { font-style: italic; margin-top: 5px; }
.tone { font-size: 1.5em; font-weight: bold; text-align: right; }

/* Body & Sections */
.epub-body {
  margin-bottom: 30px;
}

.epub-section {
  display: flex;
  margin-bottom: 15px;
  border: 1px solid #ccc; /* Simplified border for EPUB */
  page-break-inside: avoid; /* Important for EPUB/PDF */
}

.section-id-container {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  border-right: 1px solid rgba(0,0,0,0.1);
}

.section-id {
  font-size: 2.5em;
  font-weight: bold;
  line-height: 1;
}

.section-content {
  flex: 1;
  padding: 5px;
}

.compass-container {
  display: flex;
  flex-wrap: wrap;
}

/* Compass & Chords */
.epub-compass {
  flex: 1 0 calc(12.5% - 4px);
  border: 1px solid #666;
  padding: 5px;
  min-width: 60px;
  margin: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.epub-compass.space-compass {
  border-color: transparent;
}

.repeat-symbol {
  font-size: 1.5em;
  font-weight: bold;
}

.chords-display {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

.epub-chord {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.duration-symbol {
  font-size: 1em;
  min-height: 1.2em;
}

.chord-note {
  font-size: 1.4em;
  font-weight: bold;
  font-family: monospace;
}

.large-char {
  font-size: 1.15em;
}

/* Structure */
.epub-structure {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 2px solid #eee;
  page-break-inside: avoid;
}

.structure-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.structure-item {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  font-weight: bold;
  border: 2px solid #333;
}

.structure-break-filler {
  flex-grow: 1;
  min-width: 0;
  height: 50px;
}

.structure-break-force {
  width: 100%;
  height: 0;
}

/* Notes */
.epub-notes {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 2px solid #eee;
  page-break-inside: avoid;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.note-line {
  padding: 5px;
  background-color: #f9f9f9;
}

/* Lyrics */
.epub-lyrics {
  margin-top: 20px;
  border-top: 2px solid #eee;
  padding-top: 10px;
  page-break-inside: avoid;
}

.lyrics-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lyric-line-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 5px;
  background-color: #fff;
}

.lyric-id {
  font-weight: bold;
  font-size: 1.5em;
  width: 40px;
  text-align: center;
}

.lyric-text {
  font-size: 1.2em;
  white-space: pre-wrap;
  flex: 1;
}

/* Page Orientation (if relevant for EPUB, mostly for container width) */
.page-vertical { max-width: 210mm; margin: 0 auto; }
.page-horizontal { max-width: 297mm; margin: 0 auto; }

/* EPUB Compass Break Styles */
.epub-break-filler {
  flex-grow: 1;
  min-width: 0;
  height: 50px; /* Match typical compass height */
}

.epub-break-force {
  width: 100%;
  height: 0;
}

</style>
