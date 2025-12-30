<template>
  <div class="chord-display">
    <div class="duration-symbol">{{ durationSymbol }}</div>
    <div class="chord-note">
      <span 
        v-for="(char, index) in chordChars" 
        :key="index"
        :class="{ 'large-char': isLargeChar(index) }"
      >
        {{ char }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  chord: Object
})

const chordChars = computed(() => {
  const chordString = props.chord.chord || ''
  return chordString.split('')
})

const isLargeChar = (index) => {
  const chordString = props.chord.chord || ''
  
  // El primer carácter siempre es más grande
  if (index === 0) {
    return true
  }
  
  // Si hay un '/', tanto '/' como el siguiente carácter son más grandes
  const slashIndex = chordString.indexOf('/')
  if (slashIndex !== -1 && (index === slashIndex || index === slashIndex + 1)) {
    return true
  }
  
  return false
}

const durationSymbol = computed(() => {
  if (props.chord.chord === 'R') {
    return '𝄽' // Rest symbol
  }
  
  switch (props.chord.div) {
    case 1: return '' // Whole note - no symbol
    case 2: return '♩♩' // Half note - two quarter notes
    case 3: return '♩' // Quarter note - one quarter note
    case 4: return '♩' // Quarter note (legacy support)
    default: return '♩'
  }
})
</script>

<style scoped>
.chord-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 52px;
}

.duration-symbol {
  font-size: 20px;
  line-height: 1;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chord-note {
  font-size: 28px;
  font-weight: bold;
  font-family: monospace;
  display: flex;
  align-items: baseline;
}

.chord-note span {
  line-height: 1;
}

.chord-note .large-char {
  font-size: 1.15em;
}
</style>
