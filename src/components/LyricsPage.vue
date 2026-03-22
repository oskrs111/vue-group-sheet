<template>
  <div
    id="lyrics-page"
    class="lyrics-page"
    :class="isLyricsOverflowing ? 'out-of-bounds' : 'in-bounds'"
    ref="lyricsPageRef"
  >
    <div class="lyrics-header">
      <h4>{{ store.header.center.top.name || 'Sin Título' }} - {{ store.header.center.bottom.author || 'Desconocido' }}</h4>
    </div>

    <div class="lyrics-content">
      <template v-for="(item, index) in store.structure" :key="index">
        <div
          v-if="!item.isBreak"
          class="lyrics-wrapper"
        >
          <div
            class="lyrics-id-container"
            :style="{
              backgroundColor: item.b_color,
              color: item.f_color,
              borderRadius: item.shape === 'C' ? '40px' : '0'
            }"
          >
            <span class="lyrics-id">{{ item.id }}</span>
            <div class="lyrics-footer">
              <span>{{ index + 1 }}</span>
            </div>
          </div>

          <div class="lyrics-text-container">
            <div class="lyrics-view">
              <div class="lyrics-text-display">
                <pre class="lyrics-pre">{{ getLyricText(item.lyric) || '(Sin letra)' }}</pre>
              </div>
              <button class="lyrics-edit-btn" @click="startEditing(index, item.lyric)" title="Editar letra">
                <span class="material-icons">edit</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="store.exportFooterData" class="export-footer">
      <div class="footer-left">
        {{ store.exportFooterData.current }} / {{ store.exportFooterData.total }}
      </div>
      <div class="footer-right">
        <span v-if="store.exportFooterData.nextTitle">
          SIGUIENTE: {{ store.exportFooterData.nextTitle }} - {{ store.exportFooterData.nextAuthor }}
        </span>
      </div>
    </div>

    <Teleport to="#modal-container">
      <div v-if="editingIndex !== -1" class="modal-overlay" @click.self="cancelEditing">
        <div class="modal-content lyrics-edit-modal">
          <div class="modal-header">Editar Letra - {{ store.structure[editingIndex]?.id }}</div>
          <div class="modal-body lyrics-modal-body">
            <textarea
              v-model="editingText"
              class="lyrics-modal-textarea"
              placeholder="Escribe la letra aquí..."
              ref="editTextarea"
            ></textarea>
          </div>
          <div class="modal-footer lyrics-edit-footer">
            <button
              class="secondary lyrics-format-btn"
              title="Reemplazar saltos de línea por ' \\ ' (Ctrl+F)"
              @click="formatEditingText"
            >
              Formatear
            </button>
            <div class="lyrics-edit-footer-actions">
              <button class="secondary" @click="cancelEditing">Cancelar</button>
              <button class="primary" @click="saveLyric(editingIndex)">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const store = useSheetStore()
const editingIndex = ref(-1)
const editingText = ref('')
const editTextarea = ref(null)
const lyricsPageRef = ref(null)

const isLyricsOverflowing = ref(false)

const MAX_A4_HEIGHT_PX = 1167.5
let resizeObserver = null

const toBase64 = (str) => {
  try {
    return window.btoa(unescape(encodeURIComponent(str)))
  } catch (error) {
    console.error('Error encoding to base64', error)
    return ''
  }
}

const fromBase64 = (str) => {
  if (!str) return ''

  try {
    return decodeURIComponent(escape(window.atob(str)))
  } catch (error) {
    console.error('Error decoding from base64', error)
    return ''
  }
}

const getLyricText = (b64) => {
  return fromBase64(b64)
}

const formatEditingText = () => {
  editingText.value = editingText.value.replace(/\r?\n/g, ' \\ ')
}

const startEditing = (index, currentB64) => {
  editingIndex.value = index
  editingText.value = fromBase64(currentB64)

  nextTick(() => {
    editTextarea.value?.focus()
  })
}

const cancelEditing = () => {
  editingIndex.value = -1
  editingText.value = ''
}

const saveLyric = (index) => {
  const b64 = toBase64(editingText.value)
  store.updateStructureItem(index, { lyric: b64 })
  editingIndex.value = -1
  editingText.value = ''
}

const handleKeyDown = (event) => {
  if (editingIndex.value === -1 || !(event.ctrlKey || event.metaKey)) {
    return
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault()
    formatEditingText()
  }
}

onMounted(() => {
  if (lyricsPageRef.value) {
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect()
        isLyricsOverflowing.value = rect.height > MAX_A4_HEIGHT_PX
      }
    })
    resizeObserver.observe(lyricsPageRef.value)
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.in-bounds:not(.pdf-export) {
  outline: 1px solid var(--ui-accent);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
  outline-offset: -1px;
}

.out-of-bounds:not(.pdf-export) {
  outline: 1px dashed var(--ui-danger);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  outline-offset: -1px;
}

.export-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 2px solid #333;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  font-family: inherit;
}

.footer-left {
  font-weight: bold;
}

.footer-right {
  font-style: italic;
  text-align: right;
}

.lyrics-edit-footer {
  justify-content: space-between;
  align-items: center;
}

.lyrics-edit-footer-actions {
  display: flex;
  gap: 8px;
}

.lyrics-format-btn {
  margin-right: auto;
}

.lyrics-page.pdf-export {
  width: 210mm !important;
  min-height: 297mm !important;
  padding: 15mm !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  background: white !important;
}
</style>
