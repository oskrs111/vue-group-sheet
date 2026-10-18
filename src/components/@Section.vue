<template>
  <ScoreSection
    :section="section"
    :class="{ 'selected': isSelected }"
    @click="selectSection"
  >
    <template #compass="{ compass, index: cIndex, breakIndices }">
      <CompassComponent
        :compass="compass"
        :sectionIndex="index"
        :compassIndex="cIndex"
        :break-indices="breakIndices"
        :ref="element => compassRefs[cIndex] = element"
      />
    </template>
  </ScoreSection>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import CompassComponent from './@Compass.vue'
import ScoreSection from './ScoreSection.vue'

const props = defineProps({
  section: Object,
  index: Number,
  totalSections: Number
})

const store = useSheetStore()
const compassRefs = ref([])
const isSelected = computed(() => store.selectedSectionId === props.section.id)

const selectSection = (event) => {
  // Don't trigger selection if clicking on a button or link
  if (event.target.closest('button, a, [role="button"]')) {
    return
  }
  
  if (isSelected.value) {
    store.setSelectedSection(null)
  } else {
    store.setSelectedSection(props.section.id)
  }
}

const handleClickOutside = (event) => {
  // Si el clic no fue dentro de ninguna sección (o sus hijos), deseleccionar
  if (!event.target.closest('.section-wrapper')) {
    store.setSelectedSection(null)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const openCompassEditor = (compassIndex) => {
  compassRefs.value[compassIndex]?.openEditModal()
}

const openCompassDelete = (compassIndex) => {
  compassRefs.value[compassIndex]?.openDeleteModal()
}

defineExpose({
  openCompassEditor,
  openCompassDelete
})
</script>

<style scoped>
.selected {
  border-color: #1f8af5a2;
}
</style>
