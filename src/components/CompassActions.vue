<template>
  <div v-if="hasValidSelection" class="compass-actions-toolbar">
    <button @click="requestEdit" class="action-btn" title="Editar compás">
      <span class="material-icons">edit</span>
      <span class="btn-label">Editar Compás</span>
    </button>
    <button @click="copyCompass" class="action-btn" title="Copiar compás">
      <span class="material-icons">content_copy</span>
      <span class="btn-label">Copiar Compás</span>
    </button>
    <button @click="requestDelete" class="action-btn danger" title="Eliminar compás">
      <span class="material-icons">delete</span>
      <span class="btn-label">Eliminar Compás</span>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const emit = defineEmits(['edit-request', 'delete-request'])
const store = useSheetStore()

const selectedCompass = computed(() => store.selectedCompass)

const hasValidSelection = computed(() => {
  const selected = selectedCompass.value
  if (!selected) return false

  const section = store.body[selected.sIndex]
  if (!section) return false

  return selected.cIndex >= 0 && selected.cIndex < section.compass.length
})

const requestEdit = () => {
  if (hasValidSelection.value) {
    emit('edit-request')
  }
}

const requestDelete = () => {
  if (hasValidSelection.value) {
    emit('delete-request')
  }
}

const copyCompass = () => {
  if (!hasValidSelection.value) return

  const selected = selectedCompass.value
  store.copyCompass(selected.sIndex, selected.cIndex)
}

const isTypingTarget = () => {
  const activeElement = document.activeElement
  const tagName = activeElement?.tagName?.toLowerCase()

  return activeElement?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

const handleKeyDown = (event) => {
  if (!(event.ctrlKey || event.metaKey) || isTypingTarget() || !hasValidSelection.value) {
    return
  }

  if (event.key.toLowerCase() === 'c') {
    event.preventDefault()
    copyCompass()
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
.compass-actions-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--ui-bg-surface);
  border-bottom: 1px solid var(--ui-border);
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
