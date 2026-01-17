<template>
  <div id="lyrics-page" class="lyrics-page">
    <div class="lyrics-header">
      <h4>{{ store.header.center.top.name || 'Sin Título' }} - {{ store.header.center.bottom.author || 'Desconocido' }}</h4>
    </div>
    
    <div class="lyrics-content">
      <div 
        v-for="(item, index) in store.structure" 
        :key="index"
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
          <div v-if="editingIndex !== index" class="lyrics-view">
            <div class="lyrics-text-display">
              <pre class="lyrics-pre">{{ getLyricText(item.lyric) || '(Sin letra)' }}</pre>
            </div>
            <button class="lyrics-edit-btn" @click="startEditing(index, item.lyric)" title="Editar letra">
              <span class="material-icons">edit</span>
            </button>
          </div>

          <!-- Edit Mode -->
          <div v-else class="lyrics-edit">
            <textarea 
              v-model="editingText" 
              class="lyrics-textarea"
              placeholder="Escribe la letra aquí..."
              ref="editTextarea"
            ></textarea>
            <div class="lyrics-edit-actions">
              <button class="lyrics-action-btn cancel" @click="cancelEditing">
                <span class="material-icons">close</span>
              </button>
              <button class="lyrics-action-btn save" @click="saveLyric(index)">
                <span class="material-icons">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
