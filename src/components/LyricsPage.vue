<template>
  <div id="lyrics-page" class="lyrics-page">
    <div class="lyrics-header">
      <h4>{{ store.header.center.top.name || 'Sin Título' }} - {{ store.header.center.bottom.author || 'Desconocido' }}</h4>
    </div>
    
    <div class="lyrics-content">
      <template v-for="(item, index) in store.structure" :key="index">
        <div 
          v-if="!item.isBreak"
          class="lyrics-wrapper"
        >
        <!-- Left Side: Structure ID -->
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

        <!-- Right Side: Content -->
        <div class="lyrics-text-container">
          <!-- View Mode -->
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

    <!-- Export Footer -->
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
    
    <!-- Lyrics Edit Modal -->
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
          <div class="modal-footer">
            <button class="secondary" @click="cancelEditing">Cancelar</button>
            <button class="primary" @click="saveLyric(editingIndex)">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const store = useSheetStore()
const editingIndex = ref(-1)
const editingText = ref('')
const editTextarea = ref(null)

// Base64 Helpers for Unicode support
const toBase64 = (str) => {
  try {
    return window.btoa(unescape(encodeURIComponent(str)))
  } catch (e) {
    console.error('Error encoding to base64', e)
    return ''
  }
}

const fromBase64 = (str) => {
  if (!str) return ''
  try {
    return decodeURIComponent(escape(window.atob(str)))
  } catch (e) {
    console.error('Error decoding from base64', e)
    return ''
  }
}

const getLyricText = (b64) => {
  return fromBase64(b64)
}

const startEditing = (index, currentB64) => {
  editingIndex.value = index
  editingText.value = fromBase64(currentB64)
  nextTick(() => {
    if (editTextarea.value) {
      editTextarea.value[0]?.focus()
    }
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
</script>

<style scoped>
/* Export Footer Styles */
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
