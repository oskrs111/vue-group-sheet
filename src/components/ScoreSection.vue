<template>
  <div ref="root" class="section-wrapper score-section" :style="{ '--section-text-color': section.f_color }">
    <div class="section-id-container"><span class="section-id">{{ section.id }}</span></div>
    <div class="section-container">
      <div class="compass-container score-compass-grid">
        <div
          v-for="(compass, index) in section.compass"
          :key="index"
          class="score-compass-cell"
          :class="{
            'is-break': isBreak(compass),
            'is-leading-break': isBreak(compass) && (compassBounds.first === -1 || index < compassBounds.first),
            'is-trailing-break': isBreak(compass) && compassBounds.last !== -1 && index > compassBounds.last
          }"
          :data-chord-count="compass.chords.length"
        >
          <slot name="compass" :compass="compass" :index="index" :break-indices="breakGroups[index] || []">
            <div v-if="isBreak(compass)" class="score-compass-break"></div>
            <div v-else class="score-compass"><ScoreCompassContent :compass="compass" /></div>
          </slot>
        </div>
      </div>
    </div>
    <div v-if="section.turns > 1" class="section-turn-container"><span class="section-turn">x {{ section.turns }}</span></div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ScoreCompassContent from './ScoreCompassContent.vue'
import { useScoreLayout } from '../composables/useScoreLayout'
import { getBreakGroups } from '../utils/scoreLayout'
import '../styles/score-layout.css'

const props = defineProps({ section: { type: Object, required: true } })
const root = ref(null)
const isBreak = compass => compass.chords.length === 1 && compass.chords[0].chord === 'S'
const breakGroups = computed(() => getBreakGroups(props.section.compass))
const compassBounds = computed(() => {
  let first = -1
  let last = -1
  props.section.compass.forEach((compass, index) => {
    if (isBreak(compass)) return
    if (first === -1) first = index
    last = index
  })
  return { first, last }
})
useScoreLayout(root, () => props.section)
</script>
