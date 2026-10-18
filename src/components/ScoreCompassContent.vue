<template>
  <div v-if="isRepeat" class="repeat-symbol">%</div>
  <div v-else class="chords-display">
    <ChordComponent v-for="(chord, index) in compass.chords" :key="index" :chord="chord" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ChordComponent from './@Chord.vue'

const props = defineProps({ compass: { type: Object, required: true } })
const isRepeat = computed(() => props.compass.chords.length === 1 && props.compass.chords[0].chord === 'R')
</script>
