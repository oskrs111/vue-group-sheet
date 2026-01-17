<template>
  <div v-if="selectedSectionId !== null" class="section-actions-toolbar">
    <button @click="addCompass" class="action-btn" title="Añadir compás">
      <span class="material-icons">add</span>
      <span class="btn-label">Añadir Compás</span>
    </button>
    <button @click="pasteCompass" class="action-btn" :disabled="!hasCopiedCompass" title="Pegar compás al final">
      <span class="material-icons">content_paste</span>
      <span class="btn-label">Pegar Compás</span>
    </button>
    <button @click="editSection" class="action-btn" title="Editar sección">
      <span class="material-icons">edit</span>
      <span class="btn-label">Editar Sección</span>
    </button>
    <button @click="copySection" class="action-btn" title="Copiar sección">
      <span class="material-icons">content_copy</span>
      <span class="btn-label">Copiar Sección</span>
    </button>
    <button @click="pasteSection" class="action-btn" :disabled="!hasCopiedSection" title="Pegar sección">
      <span class="material-icons">content_paste</span>
      <span class="btn-label">Pegar Sección</span>
    </button>
    <button @click="moveSectionUp" class="action-btn" :disabled="isFirst" title="Subir sección">
      <span class="material-icons">arrow_upward</span>
      <span class="btn-label">Subir Sección</span>
    </button>
    <button @click="moveSectionDown" class="action-btn" :disabled="isLast" title="Bajar sección">
      <span class="material-icons">arrow_downward</span>
      <span class="btn-label">Bajar Sección</span>
    </button>
    <button @click="showDeleteModal = true" class="action-btn danger" title="Eliminar sección">
      <span class="material-icons">delete</span>
      <span class="btn-label">Eliminar Sección</span>
    </button>

    <!-- Delete Confirmation Modal -->
    <Teleport to="#modal-container">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content">
          <div class="modal-header">Confirmar Eliminación</div>
          <div class="modal-body">
            <p>¿Está seguro de que desea eliminar la sección {{ selectedSection?.id }}?</p>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showDeleteModal = false">Cancelar</button>
            <button class="primary" @click="confirmDelete">Eliminar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const store = useSheetStore()
const showDeleteModal = ref(false)

const selectedSectionId = computed(() => store.selectedSectionId)
const selectedSection = computed(() => {
  if (!selectedSectionId.value) return null
  return store.body.find(section => section.id === selectedSectionId.value)
})

const selectedSectionIndex = computed(() => {
  if (!selectedSectionId.value) return -1
  return store.body.findIndex(section => section.id === selectedSectionId.value)
})

const hasCopiedSection = computed(() => store.copiedSection !== null)
const hasCopiedCompass = computed(() => store.copiedCompass !== null)
const isFirst = computed(() => selectedSectionIndex.value === 0)
const isLast = computed(() => selectedSectionIndex.value === store.body.length - 1)

const addCompass = () => {
  if (selectedSectionIndex.value !== -1) {
    store.addCompass(selectedSectionIndex.value)
  }
}

const pasteCompass = () => {
  if (selectedSectionIndex.value !== -1) {
    store.pasteCompass(selectedSectionIndex.value)
  }
}

const emit = defineEmits(['edit'])

const editSection = () => {
  if (selectedSectionIndex.value !== -1) {
    emit('edit', selectedSection.value)
  }
}

const copySection = () => {
  if (selectedSectionIndex.value !== -1) {
    store.copySection(selectedSectionIndex.value)
  }
}

const pasteSection = () => {
  if (selectedSectionIndex.value !== -1) {
    store.pasteSection(selectedSectionIndex.value)
  }
}

const moveSectionUp = () => {
  if (selectedSectionIndex.value > 0) {
    store.moveSectionUp(selectedSectionIndex.value)
  }
}

const moveSectionDown = () => {
  if (selectedSectionIndex.value < store.body.length - 1) {
    store.moveSectionDown(selectedSectionIndex.value)
  }
}

const confirmDelete = () => {
  if (selectedSectionIndex.value !== -1) {
    store.deleteSection(selectedSectionIndex.value)
    store.setSelectedSection(null)
    showDeleteModal.value = false
  }
}
</script>

<style scoped>
.section-actions-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #bdbdbd;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.danger {
  color: #d32f2f;
  border-color: #d32f2f;
}

.action-btn.danger:hover {
  background: #ffebee;
}

.btn-label {
  font-size: 12px;
  font-weight: 500;
}

.material-icons {
  font-size: 18px;
}
</style>
