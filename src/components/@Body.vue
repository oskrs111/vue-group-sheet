<template>
  <div class="body-container">
    <div class="body-header">
      <h3>Secciones</h3>
      <div class="header-controls">
        <div class="zoom-control">
          <button @click="decreaseZoom" class="zoom-btn" title="Reducir zoom">
            <span class="material-icons">zoom_out</span>
          </button>
          <span class="zoom-label">{{ store.settings.zoom_sections }}%</span>
          <button @click="increaseZoom" class="zoom-btn" title="Aumentar zoom">
            <span class="material-icons">zoom_in</span>
          </button>
        </div>
        <button @click="addSection" class="add-btn">
          <span class="material-icons">add</span>
        </button>
      </div>
    </div>
    <div class="sections-wrapper" :style="{ zoom: store.settings.zoom_sections / 100 }">
      <SectionComponent 
        v-for="(section, index) in store.body" 
        :key="index"
        :section="section"
        :index="index"
        :totalSections="store.body.length"
        ref="sectionRefs"
      />
    </div>

    <!-- Edit Section Modal -->
    <Teleport to="#modal-container">
      <div v-if="showEditModal && localSectionData" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
          <div class="modal-header">Editar Sección {{ localSectionData.id }}</div>
          <div class="modal-body">
            <div class="form-group">
              <label>ID de Sección:</label>
              <input type="text" v-model="localSectionData.id" maxlength="3" />
            </div>
            <div class="form-group">
              <label>Repeticiones:</label>
              <input type="number" v-model.number="localSectionData.turns" min="1" max="32" />
            </div>
            <div class="form-group">
              <label>Color de Fondo:</label>
              <ColorPickerWithHistory v-model="localSectionData.b_color" />
            </div>
            <div class="form-group">
              <label>Color de Fuente:</label>
              <ColorPickerWithHistory v-model="localSectionData.f_color" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showEditModal = false">Cancelar</button>
            <button class="primary" @click="saveSection">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import SectionComponent from './@Section.vue'
import ColorPickerWithHistory from './ColorPickerWithHistory.vue'

const store = useSheetStore()
const sectionRefs = ref([])
const selectedSectionIndex = ref(-1)
const showEditModal = ref(false)
const localSectionData = ref(null)

const editSection = (section) => {
  const index = store.body.findIndex(s => s.id === section.id)
  if (index !== -1) {
    selectedSectionIndex.value = index
    const data = JSON.parse(JSON.stringify(section))
    if (data.turns === undefined) data.turns = 1
    localSectionData.value = data
    showEditModal.value = true
  }
}

const saveSection = () => {
  if (selectedSectionIndex.value !== -1 && localSectionData.value) {
    store.updateSection(selectedSectionIndex.value, localSectionData.value)
    showEditModal.value = false
  }
}

defineExpose({
  editSection,
  editCompass: (sectionIndex, compassIndex) => {
    sectionRefs.value[sectionIndex]?.openCompassEditor(compassIndex)
  },
  deleteCompass: (sectionIndex, compassIndex) => {
    sectionRefs.value[sectionIndex]?.openCompassDelete(compassIndex)
  }
})

const addSection = () => {
  store.addSection()
}

const increaseZoom = () => {
  const newZoom = Math.min(store.settings.zoom_sections + 10, 200)
  store.updateSettings({ zoom_sections: newZoom })
}

const decreaseZoom = () => {
  const newZoom = Math.max(store.settings.zoom_sections - 10, 50)
  store.updateSettings({ zoom_sections: newZoom })
}
</script>

<style scoped>
.body-container {
  margin-bottom: 30px;
}

.body-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.body-header h3 {
  font-size: 20px;
  font-weight: bold;
  color: var(--ui-text-secondary);
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--ui-bg-surface);
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
}

.zoom-btn {
  padding: 4px;
  background: transparent;
  color: var(--ui-text-primary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.zoom-btn:hover {
  background: var(--ui-bg-hover);
}

.zoom-btn .material-icons {
  font-size: 20px;
}

.zoom-label {
  font-size: 14px;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
  color: var(--ui-text-primary);
}

.sections-wrapper {
  width: fit-content;
}

/* add-btn usa estilos globales */
</style>
