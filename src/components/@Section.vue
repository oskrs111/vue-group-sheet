<template>
  <div 
    class="section-wrapper"
    :class="{ 'selected': isSelected }"
    @click="selectSection"
  >
    <div class="section-id-container">
      <span class="section-id" :style="{ '--section-f-color': section.f_color }">{{ section.id }}</span>
    </div>
    <div 
      class="section-container editable-container"
      :style="{ '--section-bg-color': section.b_color, '--section-text-color': section.f_color }"
    >
      
      <div class="compass-container">
        <CompassComponent
          v-for="(compass, cIndex) in section.compass"
          :key="cIndex"
          :compass="compass"
          :sectionIndex="index"
          :compassIndex="cIndex"
        />
      </div>
    </div>
    <div class="section-turn-container" v-if="section.turns > 1">
      <span class="section-turn" :style="{ '--section-f-color': section.f_color }">x {{ section.turns }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import CompassComponent from './@Compass.vue'

const props = defineProps({
  section: Object,
  index: Number,
  totalSections: Number
})

const store = useSheetStore()
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
</script>

<style scoped>
.section-wrapper {
  display: flex;
  gap: 0px;
  margin-bottom: 12px;
  align-items: flex-start;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.selected {
  border-color: #1f8af5a2;
}

.section-id-container {
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  position: relative;
}

.section-id {
  font-size: 35px;
  font-weight: bold;
  line-height: 1;
  color: var(--section-f-color, #000000);
}

.section-footer {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.section-footer span {
  font-size: 10px;
  font-weight: normal;
  user-select: none;
  color: var(--section-f-color, #000000);
}


.section-container {
  padding: 5px;
  flex: 1;
  width: 100%;
  background-color: var(--section-bg-color, #f2fafd);
  color: var(--section-text-color, #000000);
}

.section-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
  min-height: 24px;
}

.section-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-direction: row;
}

.section-turn{
  padding: 3px;
  font-size: 20px;
  font-weight: bold;
}

.action-btn {
  padding: 0;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  left: 6px;
}

.action-btn:hover {
  background: #1565c0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn-secondary {
  padding: 0;
  background: transparent;
  color: #666;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn-secondary:hover:not(:disabled) {
  color: #1976d2;
  transform: scale(1.1);
}

.action-btn-secondary:active:not(:disabled) {
  transform: scale(0.95);
}

.action-btn-secondary:disabled {
  color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  color: red;
}

.compass-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}
</style>
