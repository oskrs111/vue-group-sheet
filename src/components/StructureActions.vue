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
    <button @click="copyItem" class="action-btn" title="Copiar">
      <span class="material-icons">content_copy</span>
      <span class="btn-label">Copiar</span>
    </button>
    <button @click="pasteItem" class="action-btn" :disabled="!hasCopiedItem" title="Pegar">
      <span class="material-icons">content_paste</span>
      <span class="btn-label">Pegar</span>
    </button>
    <button @click="showDeleteModal = true" class="action-btn danger" title="Eliminar">
      <span class="material-icons">delete</span>
      <span class="btn-label">Eliminar</span>
    </button>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const store = useSheetStore()
const showDeleteModal = ref(false)
const emit = defineEmits(['edit-request'])

const selectedIndex = computed(() => store.selectedStructureIndex)

const isValidSelection = computed(() => {
  return selectedIndex.value !== null && selectedIndex.value >= 0 && selectedIndex.value < store.structure.length
})

const isFirst = computed(() => selectedIndex.value === 0)
const isLast = computed(() => selectedIndex.value === store.structure.length - 1)
const hasCopiedItem = computed(() => store.copiedStructureItem !== null)

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

const copyItem = () => {
  if (isValidSelection.value) {
    store.copyStructureItem(selectedIndex.value)
  }
}

const pasteItem = () => {
  if (isValidSelection.value && hasCopiedItem.value) {
    store.pasteStructureItem(selectedIndex.value)
  }
}

const confirmDelete = () => {
  if (isValidSelection.value) {
    store.deleteStructureItem(selectedIndex.value)
    showDeleteModal.value = false
  }
}

const isTypingTarget = () => {
  const activeElement = document.activeElement
  const tagName = activeElement?.tagName?.toLowerCase()

  return activeElement?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

const handleKeyDown = (event) => {
  if (!(event.ctrlKey || event.metaKey) || isTypingTarget() || !isValidSelection.value) {
    return
  }

  const key = event.key.toLowerCase()

  if (key === 'c') {
    event.preventDefault()
    copyItem()
  } else if (key === 'v' && hasCopiedItem.value) {
    event.preventDefault()
    pasteItem()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.structure-actions-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--ui-bg-surface);
  border-bottom: 1px solid var(--ui-border);
  margin-bottom: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: transparent;
  border: 1px solid var(--ui-border);
  color: var(--ui-text-primary);
  border-radius: 9999px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.action-btn:hover:not(:disabled) {
  background: var(--ui-bg-hover);
  border-color: rgba(255, 255, 255, 0.2);
  filter: brightness(1.1);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.danger {
  color: var(--ui-danger);
  border-color: var(--ui-danger);
  margin-left: auto;
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--ui-danger-hover);
  filter: none;
}

.btn-label {
  font-size: 12px;
  font-weight: 500;
}

.material-icons {
  font-size: 18px;
}
</style>
