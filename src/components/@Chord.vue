<template>
  <div class="chord-display">
    <div class="duration-symbol">{{ durationSymbol }}</div>
    <div class="chord-note" :class="{ 'is-minor': isMinorChord }">
      <span v-if="isRest" class="rest-symbol">{{ restSymbol }}</span>
      <span v-else role="img" :aria-label="chord.chord">
        <span v-for="(segment, index) in chordSegments" :key="index" aria-hidden="true"
          :class="{ 'chord-fallback': segment.fallback, 'chord-superscript': segment.superscript }">{{ segment.text }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { CHORD_FONT_KEY, DEFAULT_SHEET_FONT } from '../utils/sheetFonts'
import { getChordSegments } from '../utils/chordTypography'

const props = defineProps({
  chord: Object
})

const isRest = computed(() => props.chord.chord === 'REST')
const chordFont = inject(CHORD_FONT_KEY, computed(() => DEFAULT_SHEET_FONT))
const chordSegments = computed(() => getChordSegments(props.chord.chord || '', chordFont.value))

const isMinorChord = computed(() => {
  const value = props.chord.chord || ''
  if (value === 'R' || value === 'S' || value === 'REST') return false

  const match = value.match(/^[A-G](?:#|b)?([^/\\]*)/)
  if (!match) return false

  const suffix = match[1] || ''
  return suffix.startsWith('m') && !suffix.startsWith('maj') || suffix.startsWith('-')
})

const restSymbol = computed(() => {
  if (!isRest.value) return ''
  switch (props.chord.div) {
    case 1: return '𝄻' // Whole Rest (Redonda)
    case 5: return '𝄼.' // Dotted Half Rest (Blanca con puntillo)
    case 2: return '𝄼' // Half Rest (Blanca)
    case 3: return '𝄽' // Quarter Rest (Negra)
    case 4: return '𝄽' 
    default: return '𝄽'
  }
})

const durationSymbol = computed(() => {
  if (props.chord.chord === 'R' || props.chord.chord === 'REST') {
    return '' // No duration symbol on top for Rests
  }
  
  switch (props.chord.div) {
    case 1: return '' // Whole note - no symbol
    case 5: return '♩♩♩' // Dotted Half Note - 3 quarters
    case 2: return '♩♩' // Half note - two quarter notes
    case 3: return '♩' // Quarter note - one quarter note
    case 4: return '♩' // Quarter note (legacy support)
    default: return '♩'
  }
})
</script>
