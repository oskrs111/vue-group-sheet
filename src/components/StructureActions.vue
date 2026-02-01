<template>
  <div v-if="isValidSelection" class="structure-actions-toolbar">
    <button @click="editItem" class="action-btn" title="Editar">
      <span class="material-icons">edit</span>
      <span class="btn-label">Editar</span>
    </button>
    <button @click="moveLeft" class="action-btn" :disabled="isFirst" title="Mover a la izquierda">
      <span class="material-icons">arrow_left</span>
      <span class="btn-label">Mover Izq</span>
    </button>
    <button @click="moveRight" class="action-btn" :disabled="isLast" title="Mover a la derecha">
      <span class="material-icons">arrow_right</span>
      <span class="btn-label">Mover Der</span>
    </button>
    <button @click="addLeft" class="action-btn" title="Añadir a la izquierda">
      <span class="material-icons">playlist_add</span>
      <span class="btn-label">Añadir Izq</span>
    </button>
    <button @click="addRight" class="action-btn" title="Añadir a la derecha">
      <span class="material-icons">playlist_add</span>
      <span class="btn-label">Añadir Der</span>
    </button>
    <button @click="showDeleteModal = true" class="action-btn danger" title="Eliminar">
      <span class="material-icons">delete</span>
      <span class="btn-label">Eliminar</span>
    </button>

    <!-- Delete Confirmation Modal -->
    <Teleport to="#modal-container">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content">
          <div class="modal-header">Confirmar Eliminación</div>
          <div class="modal-body">
            <p>¿Está seguro de que desea eliminar este elemento de la estructura?</p>
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
const emit = defineEmits(['edit-request'])

const selectedIndex = computed(() => store.selectedStructureIndex)

const isValidSelection = computed(() => {
  return selectedIndex.value !== null && 
         selectedIndex.value >= 0 && 
         selectedIndex.value < store.structure.length
})

const isFirst = computed(() => selectedIndex.value === 0)
const isLast = computed(() => selectedIndex.value === store.structure.length - 1)

// Actions
const editItem = () => {
  if (isValidSelection.value) {
    emit('edit-request', selectedIndex.value)
  }
}

const moveLeft = () => {
  if (isValidSelection.value && !isFirst.value) {
    store.moveStructureItem(selectedIndex.value, selectedIndex.value - 1)
  }
}

const moveRight = () => {
  if (isValidSelection.value && !isLast.value) {
    store.moveStructureItem(selectedIndex.value, selectedIndex.value + 1)
  }
}

const addLeft = () => {
  if (isValidSelection.value) {
    store.addStructureItemAt(selectedIndex.value, 'left')
  }
}

const addRight = () => {
  if (isValidSelection.value) {
    store.addStructureItemAt(selectedIndex.value, 'right')
  }
}

const confirmDelete = () => {
  if (isValidSelection.value) {
    store.deleteStructureItem(selectedIndex.value)
    showDeleteModal.value = false
  }
}
</script>

<style scoped>
.structure-actions-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f0f0;
  border-bottom: 1px solid #d0d0d0;
  margin-bottom: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #c0c0c0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e8e8e8;
  border-color: #a0a0a0;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.danger {
  color: #d32f2f;
  border-color: #d32f2f;
  margin-left: auto;
}

.action-btn.danger:hover {
  background: #ffebee;
}

.btn-label {
  font-size: 12px;
  font-weight: 500;
}

.material-icons {
  font-size: 16px;
}
</style>
