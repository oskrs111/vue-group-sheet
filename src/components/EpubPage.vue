<template>
  <div class="epub-page-wrapper">
    <div class="epub-sheet-page" :class="pageClass" :style="fontStyles">
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
        <div class="sections-wrapper" :style="{ zoom: (sheetData.settings.zoom_sections || 100) / 100 }">
          <ScoreSection v-for="(section, index) in sheetData.body" :key="index" :section="section" />
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
          <pre v-for="(note, index) in sheetData.notes" :key="index" class="note-line">{{ note.text }}</pre>
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
import { computed, provide } from 'vue'
import ScoreSection from './ScoreSection.vue'
import { CHORD_FONT_KEY, getSheetFont, getSheetFontStyles } from '../utils/sheetFonts'

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

const fontStyles = computed(() => getSheetFontStyles(props.sheetData.settings))
provide(CHORD_FONT_KEY, computed(() => getSheetFont(props.sheetData.settings)))

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
  flex-shrink: 0;
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
  margin: 0;
  background-color: #f9f9f9;
  font-family: inherit;
  font-size: 0.82em;
  white-space: pre;
  overflow-x: auto;
  line-height: 1.5;
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

</style>
