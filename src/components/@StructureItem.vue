<template>
  <!-- Standard Structure Item -->
  <div 
    v-if="!item.isBreak" 
    class="structure-item-wrapper"
    @click.stop="selectItem"
  >
    <div 
      class="structure-item"
      :class="{ 'is-selected': isSelected }"
      :style="{ 
        backgroundColor: item.b_color, 
        color: item.f_color,
        borderRadius: item.shape === 'C' ? '40px' : '0'
      }"
    >
      <span class="item-id">{{ item.id }}</span>
    </div>
    
    <div class="structure-footer">
      <span class="">{{ index + 1 }}</span>
    </div>
    
    <!-- Edit Modal (Triggered by Parent via ref) -->
    <Teleport to="#modal-container">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
        <div class="modal-header">Editar Elemento de Estructura</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tipo:</label>
            <select v-model="localData.isBreak">
              <option :value="false">Sección</option>
              <option :value="true">Salto de Línea</option>
            </select>
          </div>

          <div v-if="!localData.isBreak">
            <div class="form-group">
              <label>Sección:</label>
              <select v-model="localData.id">
                <option v-for="section in store.body" :key="section.id" :value="section.id">
                  {{ section.id }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Forma:</label>
              <select v-model="localData.shape">
                <option value="S">Cuadrado</option>
                <option value="C">Redondeado</option>
              </select>
            </div>
            <div class="form-group">
              <label>Color de Fondo:</label>
              <ColorPickerWithHistory v-model="localData.b_color" />
            </div>
            <div class="form-group">
              <label>Color de Fuente:</label>
              <ColorPickerWithHistory v-model="localData.f_color" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="closeModal">Cancelar</button>
          <button class="primary" @click="save">Guardar</button>
        </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- BREAK MODE: Filler + Force Line Break (Fragment) -->
  <template v-else>
    <!-- Filler: Takes remaining space -->
    <div 
      class="structure-break-filler" 
      :class="{ 'is-selected': isSelected }"
      @click.stop="selectItem"
    >
      <div class="break-display">
        <span class="break-label">Salto de Línea</span>
      </div>

      <!-- Re-use Modals for Break Item -->
      <Teleport to="#modal-container">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
        <div class="modal-header">Editar Elemento de Estructura</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tipo:</label>
            <select v-model="localData.isBreak">
              <option :value="false">Sección</option>
              <option :value="true">Salto de Línea</option>
            </select>
          </div>
          <!-- Break specific settings if any -->
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="closeModal">Cancelar</button>
          <button class="primary" @click="save">Guardar</button>
        </div>
        </div>
      </div>
    </Teleport>
    </div>

    <!-- Force Break: Forces new line -->
    <div class="structure-break-force"></div>
  </template>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import ColorPickerWithHistory from './ColorPickerWithHistory.vue'

const props = defineProps({
  item: Object,
  index: Number
})

const store = useSheetStore()
const showEditModal = ref(false)
// ShowDeleteModal is now handled by parent via store action + modal

const localData = ref(JSON.parse(JSON.stringify(props.item)))

// Update localData when props change (e.g. after save)
watch(() => props.item, (newVal) => {
  localData.value = JSON.parse(JSON.stringify(newVal))
}, { deep: true })

const isSelected = computed(() => store.selectedStructureIndex === props.index)

const selectItem = () => {
  store.setSelectedStructureIndex(props.index)
}

const openEditModal = () => {
  localData.value = JSON.parse(JSON.stringify(props.item))
  showEditModal.value = true
}

const closeModal = () => {
  showEditModal.value = false
}

const save = () => {
  store.updateStructureItem(props.index, localData.value)
  showEditModal.value = false
}

// Expose openEditModal to parent
defineExpose({ openEditModal })
</script>

<style scoped>
.structure-item-wrapper {
  position: relative;
  width: 61px;
  height: 61px;
}

.structure-item {
  width: 60px;
  height: 60px;
  border: 2px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 35px;
  font-weight: bold;
  cursor: pointer;
}

.structure-item.is-selected {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.5);
}

/* Base Styles */
.item-id {
  user-select: none;
}

.structure-header {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.structure-header.relative-controls {
  position: relative;
  top: auto;
  left: auto;
  right: auto;
  width: 50px;
}

/* Break Implementation */
.structure-break-filler {
  flex-grow: 1;
  min-width: 0; /* Allows standard flex behavior */
  height: 61px; /* Match standard item height */
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Push controls to right */
  position: relative;
  cursor: pointer;
}

.structure-break-filler.is-selected {
  box-shadow: inset 0 0 0 2px #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
}

.structure-break-force {
  width: 100%;
  height: 0;
}

.break-display {
  padding-right: 10px;
}

.break-label {
  font-size: 12px;
  color: #999;
  font-style: italic;
  white-space: nowrap;
}

/* Footer for standard items */
.structure-footer {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.structure-footer span {
  font-size: 10px;
  font-weight: normal;
  user-select: none;
}
@media print {
  .break-display, .break-controls, .structure-edit-btn, .delete-btn-small {
    display: none !important;
  }
}

/* Also hide when specific class is applied during export if simple print media query fails */
.pdf-export .break-display,
.pdf-export .break-controls,
.pdf-export .structure-edit-btn,
.pdf-export .delete-btn-small {
  display: none !important;
}
</style>
