<template>
  <div class="toolbar" role="toolbar" aria-label="Herramientas de edición de la canción">
    <div class="toolbar-group" role="group" aria-label="Archivo">
    <button @click="newFile" title="Nuevo Archivo" class="toolbar-btn">
      <AppIcon name="note_add" />
      <span class="btn-label">Nuevo</span>
    </button>
    <button @click="openSaveDialog" title="Guardar Como" class="toolbar-btn primary">
      <AppIcon name="save" />
      <span class="btn-label">Guardar</span>
    </button>
    <button @click="openLoadDialog" title="Abrir Canción" class="toolbar-btn">
      <AppIcon name="folder_open" />
      <span class="btn-label">Abrir</span>
    </button>
    </div>
    <span class="toolbar-divider" aria-hidden="true"></span>
    <div class="toolbar-group" role="group" aria-label="Exportación">
    <button @click="exportPDF" title="Exportar PDF" class="toolbar-btn">
      <AppIcon name="picture_as_pdf" />
      <span class="btn-label">PDF</span>
    </button>
    <button @click="exportEPUB" title="Exportar EPUB" class="toolbar-btn">
      <AppIcon name="book" />
      <span class="btn-label">EPUB</span>
    </button>
    <button @click="print" title="Imprimir" class="toolbar-btn">
      <AppIcon name="print" />
      <span class="btn-label">Imprimir</span>
    </button>
    </div>
    <span class="toolbar-divider" aria-hidden="true"></span>
    <div class="toolbar-group" role="group" aria-label="Intercambio de archivos">
    <button @click="showExportModal = true" title="Exportar..." class="toolbar-btn">
      <AppIcon name="file_upload" />
      <span class="btn-label">Exportar</span>
    </button>
    <button @click="showImportModal = true" title="Importar..." class="toolbar-btn">
      <AppIcon name="file_download" />
      <span class="btn-label">Importar</span>
      <input 
        type="file" 
        ref="fileInput" 
        @click.stop
        style="display: none" 
        accept=".gse,.json"
        @change="handleImportJSON"
      />
      <input 
        type="file" 
        ref="fileInputGlobal" 
        @click.stop
        style="display: none" 
        accept=".backup,.gse,.json"
        @change="handleImportBackup"
      />
    </button>
    </div>
    <span class="toolbar-spacer"></span>
    <div class="toolbar-group" role="group" aria-label="Herramientas">
    <button @click="openScriptDialog" title="Script" class="toolbar-btn">
      <AppIcon name="code" />
      <span class="btn-label">Script</span>
    </button>
    <button @click="openSettings" title="Configuración" class="toolbar-btn">
      <AppIcon name="settings" />
      <span class="btn-label">Ajustes</span>
    </button>
    <button @click="openHelp" title="Ayuda" class="toolbar-btn">
      <AppIcon name="help_outline" />
      <span class="btn-label">Ayuda</span>
    </button>
    </div>
    
    <!-- Modal Guardar Como -->
    <Teleport to="#modal-container">
      <div v-dialog v-if="showSaveDialog" class="modal-overlay" @click.self="showSaveDialog = false">
        <div class="modal-content">
        <div class="modal-header">Guardar Canción</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre de la Canción:</label>
            <input 
              v-model="songName" 
              type="text" 
              placeholder="Introduce el nombre"
              @keyup.enter="saveAs"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="showSaveDialog = false">Cancelar</button>
          <button class="primary" @click="saveAs">Guardar canción</button>
        </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Modal Abrir Canción -->
    <Teleport to="#modal-container">
      <div v-dialog v-if="showLoadDialog" class="modal-overlay" @click.self="showLoadDialog = false">
        <div class="modal-content" style="max-width: 800px; width: 90%;">
        <div class="modal-header">Abrir Canción</div>
        <div class="modal-body">
          <div class="dialog-filters" style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
            <input type="text" v-model="searchQuery" aria-label="Buscar por título o autor" placeholder="Buscar por título o autor..." class="search-input" style="flex: 1; min-width: 200px; padding: 10px; border-radius: 4px; border: 1px solid var(--ui-border); background: var(--ui-bg-input); color: var(--ui-text-input);" />
            <select v-model="sortBy" aria-label="Ordenar canciones" class="sort-select" style="padding: 10px; border-radius: 4px; border: 1px solid var(--ui-border); background: var(--ui-bg-input); color: var(--ui-text-input);">
              <option value="date">Más recientes</option>
              <option value="alpha">Alfabético</option>
            </select>
            <select v-model="filterCollection" aria-label="Filtrar por colección" class="collection-select" style="padding: 10px; border-radius: 4px; border: 1px solid var(--ui-border); background: var(--ui-bg-input); color: var(--ui-text-input);">
              <option value="">Todas las colecciones</option>
              <option v-for="collection in collectionStore.collections" :key="collection.id" :value="collection.id">
                {{ collection.name }}
              </option>
            </select>
          </div>
          
          <div v-if="filteredSongsList.length === 0" style="padding: 20px; text-align: center; color: var(--ui-text-secondary);">
            No hay canciones guardadas que coincidan
          </div>
          <div v-else class="songs-list">
            <div 
              v-for="song in filteredSongsList" 
              :key="song.id"
              class="song-item"
              role="button"
              tabindex="0"
              @keydown.enter.self="loadSong(song.id)"
              @keydown.space.self.prevent="selectSong(song.id)"
              :class="{ selected: selectedSongId === song.id }"
              @click="selectSong(song.id)"
              @dblclick="loadSong(song.id)"
            >
              <div class="song-info">
                <div class="song-name">{{ song.name }}</div>
                <div class="song-author">{{ song.header?.center?.bottom?.author || 'Sin autor' }}</div>
                <div class="song-date">{{ formatDate(song.updatedAt || song.createdAt) }}</div>
              </div>
              <div class="song-actions">
                <button @click.stop="deleteSong(song.id)" class="delete-btn-small" title="Eliminar">
                  <AppIcon name="delete" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="showLoadDialog = false">Cerrar</button>
          <button class="primary" :disabled="!selectedSongId" @click="loadSelectedSong">Abrir canción</button>
        </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Modal Script -->
    <Teleport to="#modal-container">
      <div v-dialog v-if="showScriptDialog" class="modal-overlay" @click.self="closeScriptDialog">
        <div class="modal-content script-modal">
          <div class="modal-header">Script</div>
          <div class="modal-body script-modal-body">
            <div class="script-editor">
              <div class="script-line-numbers" aria-hidden="true">
                <div
                  class="script-line-numbers-inner"
                  :style="{ transform: `translateY(-${scriptScrollTop}px)` }"
                >
                  <div
                    v-for="lineNumber in scriptLineNumbers"
                    :key="lineNumber"
                    class="script-line-number"
                    :class="{ 'is-error': scriptErrorLine === lineNumber }"
                  >
                    {{ lineNumber }}
                  </div>
                </div>
              </div>
              <textarea
              ref="scriptTextareaRef"
              v-model="scriptText"
              aria-label="Script de la canción"
              class="script-textarea"
              placeholder="Escribe tu script aquí..."
              spellcheck="false"
              wrap="hard"
              @input="handleScriptInput"
              @scroll="syncScriptGutterScroll"
            ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <div class="script-footer-tools">
              <button class="secondary script-transform-btn" @click="collapseLyricsLineBreaks" type="button" title="Convierte los saltos de línea del bloque Lyrics en separadores /">Unir líneas de letra</button>
              <div
                v-if="scriptValidationMessage"
                class="modal-footer-message script-error-message"
                aria-live="polite"
              >
                {{ scriptValidationMessage }}
              </div>
            </div>
            <button class="secondary" @click="closeScriptDialog">Cancelar</button>
            <button class="primary" @click="applyScript">Aplicar script</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="#modal-container">
      <SettingsModal v-if="showSettings" @close="showSettings = false"></SettingsModal>
      <HelpModal v-if="showHelp" @close="showHelp = false" />
      <ConfirmDialog
        :key="confirmState.id"
        v-model="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :confirmText="confirmState.confirmText"
        :cancelText="confirmState.cancelText"
        :alternativeText="confirmState.alternativeText"
        :alternativeDanger="confirmState.alternativeDanger"
        :isDanger="confirmState.isDanger"
        @confirm="confirmState.onConfirm"
        @alternative="confirmState.onAlternative"
        @cancel="confirmState.onCancel"
      />

      <!-- Modal Selección Importación -->
      <div v-dialog v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
        <div class="modal-content">
          <div class="modal-header">Importar archivos</div>
          <div class="modal-body">
            <div class="songs-list">
              <div class="song-item" role="button" tabindex="0" @click="selectImport('song')" @keydown.enter="selectImport('song')" @keydown.space.prevent="selectImport('song')">
                <div class="song-info">
                  <div class="song-name">Canción</div>
                  <div class="song-author">Archivo individual</div>
                  <div class="song-date">Importar un archivo de canción (.gse o .json)</div>
                </div>
                <div class="song-actions">
                  <AppIcon style="color: var(--ui-text-secondary)" name="description" />
                </div>
              </div>
              <div class="song-item" role="button" tabindex="0" @click="selectImport('all')" @keydown.enter="selectImport('all')" @keydown.space.prevent="selectImport('all')">
                <div class="song-info">
                  <div class="song-name">Copia de seguridad</div>
                  <div class="song-author">Canciones y colecciones</div>
                  <div class="song-date">Fusionar el backup con tu biblioteca o reemplazarla</div>
                </div>
                <div class="song-actions">
                  <AppIcon style="color: var(--ui-danger)" name="storage" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showImportModal = false">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Modal Selección Exportación -->
      <div v-dialog v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
        <div class="modal-content">
          <div class="modal-header">Exportar archivos</div>
          <div class="modal-body">
            <div class="songs-list">
              <div class="song-item" role="button" tabindex="0" @click="selectExport('song')" @keydown.enter="selectExport('song')" @keydown.space.prevent="selectExport('song')">
                <div class="song-info">
                  <div class="song-name">{{ store.header?.center?.top?.name || 'Canción Actual' }}</div>
                  <div v-if="store.header?.center?.bottom?.author" class="song-author">{{ store.header.center.bottom.author }}</div>
                  <div class="song-date">Exportar esta canción en formato nativo (.gse)</div>
                </div>
                <div class="song-actions">
                  <AppIcon style="color: var(--ui-text-secondary)" name="description" />
                </div>
              </div>
              <div class="song-item" role="button" tabindex="0" @click="selectExport('all')" @keydown.enter="selectExport('all')" @keydown.space.prevent="selectExport('all')">
                <div class="song-info">
                  <div class="song-name">Copia de seguridad</div>
                  <div class="song-author">Biblioteca completa</div>
                  <div class="song-date">Guardar todas las canciones y colecciones en un archivo .backup</div>
                </div>
                <div class="song-actions">
                  <AppIcon style="color: var(--ui-primary)" name="cloud_download" />
                </div>
              </div>
              <div class="song-item" role="button" tabindex="0" @click="selectExport('musicxml')" @keydown.enter="selectExport('musicxml')" @keydown.space.prevent="selectExport('musicxml')">
                <div class="song-info">
                  <div class="song-name">MusicXML</div>
                  <div class="song-author">Formato Estándar</div>
                  <div class="song-date">Exportar para MuseScore, Sibelius, etc.</div>
                </div>
                <div class="song-actions">
                  <AppIcon style="color: var(--ui-accent)" name="music_note" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showExportModal = false">Cancelar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import { useCollectionStore } from '../stores/collectionStore'
import SettingsModal from './SettingsModal.vue'
import { toPng, toBlob, getFontEmbedCSS } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { saveExport as saveFile } from '../utils/saveExport'
import { prepareScoreExport } from '../utils/scoreLayout'
import HelpModal from './HelpModal.vue'
import { useNotificationStore } from '../stores/notificationStore'
import ConfirmDialog from './UI/ConfirmDialog.vue'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { chooseBackupImport, lyricsExportOptions } from '../utils/dialogChoices'
import { generateScript, parseScript } from '../utils/ScriptEngine.js'

const store = useSheetStore()
const collectionStore = useCollectionStore()
const notification = useNotificationStore()
const showHelp = ref(false)
const showSettings = ref(false)
const showSaveDialog = ref(false)
const showLoadDialog = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)
const showScriptDialog = ref(false)
const scriptText = ref('')
const SCRIPT_INLINE_LYRIC_BREAK = ' / '
const scriptValidationMessage = ref('')
const scriptErrorLine = ref(null)
const scriptScrollTop = ref(0)
const scriptTextareaRef = ref(null)
const hasAttemptedScriptValidation = ref(false)
const selectedSongId = ref(null)
const songName = ref('')
const fileInput = ref(null)
const fileInputGlobal = ref(null)

const searchQuery = ref('')
const sortBy = ref('date')
const filterCollection = ref('')

const { confirmState, showConfirm, askConfirm } = useConfirmDialog()

const openSettings = () => {
  showSettings.value = true
}

const openHelp = () => {
  showHelp.value = true
}

const openScriptDialog = () => {
  // Generate script from current song state
  try {
    scriptText.value = generateScript({
      header: store.header,
      body: store.body,
      structure: store.structure,
    })
  } catch (e) {
    console.error('Error generating script:', e)
    scriptText.value = '// Error generando el script: ' + e.message
  }

  resetScriptValidation()
  showScriptDialog.value = true
  nextTick(() => {
    scriptTextareaRef.value?.focus()
    syncScriptGutterScroll()
  })
}

const closeScriptDialog = () => {
  resetScriptValidation()
  showScriptDialog.value = false
}

const resetScriptValidation = () => {
  scriptValidationMessage.value = ''
  scriptErrorLine.value = null
  scriptScrollTop.value = 0
  hasAttemptedScriptValidation.value = false
}

const scriptLineNumbers = computed(() => {
  const lineCount = Math.max(scriptText.value.split('\n').length, 1)
  return Array.from({ length: lineCount }, (_, index) => index + 1)
})

const syncScriptGutterScroll = () => {
  scriptScrollTop.value = scriptTextareaRef.value?.scrollTop || 0
}

const focusScriptErrorLine = (lineNumber) => {
  const textarea = scriptTextareaRef.value
  if (!textarea || !lineNumber) return

  const lines = scriptText.value.split('\n')
  const safeLineNumber = Math.min(Math.max(lineNumber, 1), Math.max(lines.length, 1))
  const selectionStart = lines
    .slice(0, safeLineNumber - 1)
    .reduce((total, line) => total + line.length + 1, 0)
  const lineText = lines[safeLineNumber - 1] || ''
  const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 20

  textarea.focus()
  textarea.setSelectionRange(selectionStart, selectionStart + lineText.length)
  textarea.scrollTop = Math.max(0, (safeLineNumber - 2) * lineHeight)
  syncScriptGutterScroll()
}

const validateScriptText = ({ scrollToError = false } = {}) => {
  try {
    const patch = parseScript(scriptText.value, {
      header: store.header,
      body: store.body,
      structure: store.structure,
    })

    scriptValidationMessage.value = ''
    scriptErrorLine.value = null
    return patch
  } catch (e) {
    console.error('Error parsing script:', e)
    scriptValidationMessage.value = e.message || 'El script contiene errores de formato.'
    scriptErrorLine.value = Number.isFinite(e.lineNumber) ? e.lineNumber : null

    if (scrollToError && scriptErrorLine.value) {
      nextTick(() => focusScriptErrorLine(scriptErrorLine.value))
    }

    return null
  }
}

const handleScriptInput = () => {
  if (!hasAttemptedScriptValidation.value) {
    scriptValidationMessage.value = ''
    scriptErrorLine.value = null
    return
  }

  validateScriptText()
}

const collapseLyricsLineBreaks = () => {
  scriptText.value = collapseLyricsBlockLineBreaks(scriptText.value)

  if (hasAttemptedScriptValidation.value) {
    validateScriptText()
  } else {
    scriptValidationMessage.value = ''
    scriptErrorLine.value = null
  }

  nextTick(() => scriptTextareaRef.value?.focus())
}

const applyScript = () => {
  hasAttemptedScriptValidation.value = true
  const patch = validateScriptText({ scrollToError: true })
  if (!patch) return

  try {
    store.importData({
      header: patch.header,
      body: patch.body,
      structure: patch.structure,
      notes: store.notes,
      settings: store.settings,
    }, {
      operation: 'Aplicar script'
    })
    closeScriptDialog()
    notification.addToast('Script aplicado — Ctrl+Z para deshacer', 'success')
  } catch (e) {
    console.error('Error applying script:', e)
    scriptValidationMessage.value = e.message || 'No se pudo aplicar el script.'
    notification.addToast('Error en el script: ' + e.message, 'error')
  }
}

const isTypingTarget = () => {
  const activeElement = document.activeElement
  const tagName = activeElement?.tagName?.toLowerCase()

  return activeElement?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

const handleGlobalKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !isTypingTarget() && store.undoHistory.length > 0) {
    e.preventDefault()
    const undoneEntry = store.undoLastChange()
    if (undoneEntry) {
      notification.addToast(`Deshecho: ${undoneEntry.operation}`, 'info')
    }
  }
}

let stopDesktopSettings
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  stopDesktopSettings = window.electronAPI?.onOpenSettings(() => { showSettings.value = true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  stopDesktopSettings?.()
})

const songsList = computed(() => store.getSongsList())

const filteredSongsList = computed(() => {
  let list = [...songsList.value]
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(song => {
      const name = (song.name || '').toLowerCase()
      const author = song.header?.center?.bottom?.author ? song.header.center.bottom.author.toLowerCase() : ''
      return name.includes(query) || author.includes(query)
    })
  }
  
  if (filterCollection.value) {
    const collection = collectionStore.collections.find(c => c.id === filterCollection.value)
    if (collection) {
      list = list.filter(song => collection.songs.includes(song.id))
    }
  }
  
  if (sortBy.value === 'alpha') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else {
    list.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || ''
      const dateB = b.updatedAt || b.createdAt || ''
      return dateB.localeCompare(dateA)
    })
  }
  
  return list
})

const syncLoadDialogFilters = () => {
  if (!filterCollection.value) return

  const collectionExists = collectionStore.collections.some(
    collection => collection.id === filterCollection.value
  )

  if (!collectionExists) {
    filterCollection.value = ''
  }
}

const openLoadDialog = (query = '') => {
  collectionStore.loadCollections()
  searchQuery.value = typeof query === 'string' ? query : ''
  selectedSongId.value = null
  syncLoadDialogFilters()
  showLoadDialog.value = true
}

const newFile = () => {
  showConfirm({
    title: 'Nueva canción',
    message: 'Se abrirá una canción vacía. Los cambios sin guardar del editor se descartarán.',
    confirmText: 'Crear canción',
    onConfirm: () => {
      store.newFile()
      notification.addToast('Nuevo archivo creado', 'info')
    }
  })
}

const openSaveDialog = () => {
  // Usar el nombre actual de la canción como valor por defecto
  const currentName = store.header.center.top.name
  
  // Si el nombre está en blanco, abrir el diálogo vacío para que el usuario lo introduzca
  if (!currentName || currentName.trim() === '') {
    songName.value = ''
  } else {
    // Si hay un nombre válido, usarlo como valor por defecto
    songName.value = currentName
  }
  
  showSaveDialog.value = true
}

const saveAs = () => {
  const nameToSave = songName.value.trim()
  
  if (!nameToSave) {
    notification.addToast('Por favor, introduce un nombre para la canción', 'warning')
    return
  }
  
  try {
    // Actualizar el nombre en los datos de la canción ANTES de guardar
    // Esto asegura que el nombre se sincroniza correctamente
    const currentName = store.header.center.top.name
    if (!currentName || currentName.trim() === '' || currentName !== nameToSave) {
      store.updateName(nameToSave)
    }
    
    // Guardar la canción con el nombre actualizado
    store.saveSongAs(nameToSave)
    
    notification.addToast(`Canción "${nameToSave}" guardada correctamente`, 'success')
    songName.value = ''
    showSaveDialog.value = false
  } catch (error) {
    notification.addToast('Error al guardar: ' + error.message, 'error')
  }
}

const findSongById = (id) => {
  return songsList.value.find(song => song.id === id)
}

const selectSong = (id) => {
  selectedSongId.value = id
}

const loadSelectedSong = () => {
  if (selectedSongId.value) {
    loadSong(selectedSongId.value)
  }
}

const loadSong = (id) => {
  const song = findSongById(id)
  const name = song?.name || 'sin nombre'

  showConfirm({
    title: 'Abrir canción',
    message: `Se abrirá «${name}». Los cambios sin guardar del editor se descartarán.`,
    confirmText: 'Abrir canción',
    onConfirm: () => {
      try {
        store.loadSong(id)
        showLoadDialog.value = false
        notification.addToast(`Canción "${name}" abierta`, 'success')
      } catch (error) {
        notification.addToast('Error al abrir: ' + error.message, 'error')
      }
    }
  })
}

const deleteSong = (id) => {
  const song = findSongById(id)
  const name = song?.name || 'sin nombre'

  showConfirm({
    title: 'Eliminar canción',
    message: `Se eliminará «${name}» de la biblioteca. Las colecciones que la incluyan conservarán la referencia como pendiente.`,
    isDanger: true,
    confirmText: 'Eliminar canción',
    onConfirm: () => {
      store.deleteSong(id)
      notification.addToast(`Canción "${name}" eliminada`, 'info')
      if (selectedSongId.value === id) {
        selectedSongId.value = null
      }
    }
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}



const formatDateForFileName = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}_${hours}-${minutes}`
}

const getExportFileName = () => {
    const name = (store.header.center.top.name || 'cancion').replace(/[^a-z0-9áéíóúñ_\- ]/gi, '').trim()
    const author = (store.header.center.bottom.author || '').replace(/[^a-z0-9áéíóúñ_\- ]/gi, '').trim()
    const dateTime = formatDateForFileName(new Date())
    
    if (author) {
        return `${name}-${author}_${dateTime}`
    }
    return `${name}_${dateTime}`
}

// Rewriting exportPDF to use html-to-image + jsPDF
const exportPDF = async () => {
    const sheetPage = document.getElementById('sheet-page')
    if (!sheetPage) {
        notification.addToast('No se encontró el contenido de la página para exportar', 'error')
        return
    }

    const hadInBounds = sheetPage.classList.contains('in-bounds')
    const hadOutOfBounds = sheetPage.classList.contains('out-of-bounds')
    const prevOutline = sheetPage.style.outline
    const prevBoxShadow = sheetPage.style.boxShadow

    try {
        let fileName = getExportFileName()
        let includeLyrics = false

        // Check if lyrics are available/enabled and ask user
        if (store.settings.show_lyrics) {
            includeLyrics = await askConfirm(lyricsExportOptions)
            if (includeLyrics === null) return
            if (includeLyrics) {
                fileName += '_LETRAS'
            }
        }

        sheetPage.classList.add('pdf-export')
        // Quitar indicadores visuales A4 para evitar que box-shadow/outline agrande el canvas
        sheetPage.classList.remove('in-bounds', 'out-of-bounds')

        // Forzar sin sombra/outline vía inline style (mayor prioridad que cualquier CSS)
        sheetPage.style.outline = 'none'
        sheetPage.style.boxShadow = 'none'

        // Esperar un tick y asegurarse de que las fuentes estén cargadas
        await nextTick()
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready
        }

        // Pre-embeber fuentes para captura fiel
        await prepareScoreExport(sheetPage)
        const fontEmbedCSS = await getFontEmbedCSS(sheetPage)

        // Setup PDF - A4
        const isPortrait = store.settings.page_orientation === 'V'
        const pdf = new jsPDF({
            orientation: isPortrait ? 'portrait' : 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
        })
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        // Capturar sheet con html-to-image
        const sheetDataUrl = await toPng(sheetPage, {
            quality: 1,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            fontEmbedCSS
        })

        const sheetImgProps = pdf.getImageProperties(sheetDataUrl)
        const sheetRatio = sheetImgProps.width / sheetImgProps.height
        let printWidth = pdfWidth
        let printHeight = printWidth / sheetRatio
        if (printHeight > pdfHeight) {
            printHeight = pdfHeight
            printWidth = printHeight * sheetRatio
        }
        const xOffset = (pdfWidth - printWidth) / 2
        pdf.addImage(sheetDataUrl, 'PNG', xOffset, 0, printWidth, printHeight)

        // Capturar lyrics si el usuario lo pidió
        if (includeLyrics) {
            const lyricsPage = document.getElementById('lyrics-page')
            if (lyricsPage) {
                lyricsPage.classList.add('pdf-export')
                try {
                    const lyricsFontCSS = await getFontEmbedCSS(lyricsPage)
                    const lyricsDataUrl = await toPng(lyricsPage, {
                        quality: 1,
                        pixelRatio: 3,
                        backgroundColor: '#ffffff',
                        fontEmbedCSS: lyricsFontCSS
                    })

                    const lyricsImgProps = pdf.getImageProperties(lyricsDataUrl)
                    const lyricsRatio = lyricsImgProps.width / lyricsImgProps.height
                    let lw = pdfWidth
                    let lh = lw / lyricsRatio
                    if (lh > pdfHeight) {
                        lh = pdfHeight
                        lw = lh * lyricsRatio
                    }
                    const lx = (pdfWidth - lw) / 2

                    pdf.addPage()
                    pdf.addImage(lyricsDataUrl, 'PNG', lx, 0, lw, lh)
                } catch (e) {
                    console.error('Error capturing lyrics:', e)
                } finally {
                    lyricsPage.classList.remove('pdf-export')
                }
            }
        }

        await saveFile(pdf.output('blob'), `${fileName}.pdf`)

    } catch (error) {
        console.error('Error generating PDF:', error)
        notification.addToast('Error al generar el PDF: ' + error.message, 'error')
    } finally {
        sheetPage.classList.remove('pdf-export')
        sheetPage.style.outline = prevOutline
        sheetPage.style.boxShadow = prevBoxShadow
        // Restaurar indicadores visuales A4
        if (hadInBounds) sheetPage.classList.add('in-bounds')
        if (hadOutOfBounds) sheetPage.classList.add('out-of-bounds')
    }
}



const exportEPUB = async () => {
    try {
        const sheetPage = document.getElementById('sheet-page')
        if (!sheetPage) {
            notification.addToast('No se encontró el contenido de la página para exportar', 'error')
            return
        }

        let fileName = getExportFileName()
        let includeLyrics = false

        // Check if lyrics are available/enabled and ask user
        if (store.settings.show_lyrics) {
            includeLyrics = await askConfirm(lyricsExportOptions)
            if (includeLyrics === null) return
            if (includeLyrics) {
                fileName += '_LETRAS'
            }
        }

        const songsToExport = []
        const imageBlobs = []
        
        // Prepare song data
        const songData = {
            header: store.header,
            body: store.body,
            structure: store.structure,
            notes: store.notes,
            settings: store.settings
        }

        // 1. Capture Sheet
        sheetPage.classList.add('pdf-export')
        await nextTick()
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready
        }
        try {
            await prepareScoreExport(sheetPage)
            const fontEmbedCSS = await getFontEmbedCSS(sheetPage)
            const blob = await toBlob(sheetPage, {
                quality: 0.9,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                fontEmbedCSS,
                type: 'image/jpeg'
            })
            
            songsToExport.push(songData)
            imageBlobs.push(blob)
        } finally {
            sheetPage.classList.remove('pdf-export')
        }

        // 2. Capture Lyrics if present AND user wants them
        if (includeLyrics) {
            const lyricsPage = document.getElementById('lyrics-page')
            if (lyricsPage) {
                lyricsPage.classList.add('pdf-export')
                try {
                    const fontEmbedCSS = await getFontEmbedCSS(lyricsPage)
                    const blob = await toBlob(lyricsPage, {
                        quality: 0.9,
                        pixelRatio: 2,
                        backgroundColor: '#ffffff',
                        fontEmbedCSS,
                        type: 'image/jpeg'
                    })
                    
                    // Clone data but append (Letra) to name
                    const lyricData = JSON.parse(JSON.stringify(songData))
                    if (lyricData.header?.center?.top) {
                        lyricData.header.center.top.name = (lyricData.header.center.top.name || '') + ' (Letra)'
                    }
                    
                    songsToExport.push(lyricData)
                    imageBlobs.push(blob)
                } finally {
                    lyricsPage.classList.remove('pdf-export')
                }
            }
        }

        // 3. Generate EPUB
        const { EpubGenerator } = await import('../utils/EpubGenerator.js')
        // Pass simple name to generator logic if needed, but filename for save
        const generator = new EpubGenerator(store.header.center.top.name || 'cancion', songsToExport)
        
        const blob = await generator.generateFromImages(imageBlobs)
        
        // 4. Download
        await saveFile(blob, `${fileName}.epub`)

    } catch (error) {
        console.error('Error exportando EPUB:', error)
        notification.addToast('Error al generar EPUB: ' + error.message, 'error')
    }
}

const exportJSON = async () => {
  try {
    const fileName = getExportFileName()
    const now = new Date().toISOString()
    
    // Si no hay ID (canción nueva no guardada), generamos uno temporal para el archivo
    let exportId = store.currentSongId
    if (!exportId) {
        exportId = crypto.randomUUID()
    }

    const songData = {
        id: exportId,
        name: store.header.center.top.name || 'Nueva Canción',
        header: store.header,
        body: store.body,
        structure: store.structure,
        notes: store.notes,
        settings: store.settings,
        createdAt: now, 
        updatedAt: now
    }
    
    // Si la canción ya existe en el registro, intentamos obtener sus fechas reales
    if (store.currentSongId) {
        const existing = store.getSongsRegistry().songs[store.currentSongId]
        if (existing) {
            songData.createdAt = existing.createdAt
            songData.updatedAt = now
        }
    }

    const blob = new Blob([JSON.stringify(songData, null, 2)], { type: 'application/json' })
    await saveFile(blob, `${fileName}.gse`)
    notification.addToast('Canción exportada exitosamente', 'success')
  } catch (error) {
    console.error('Error exportando canción:', error)
    notification.addToast('Error al exportar la canción: ' + error.message, 'error')
  }
}

const triggerImportJSON = () => {
    if (fileInput.value) {
        fileInput.value.value = '' // Reset
        fileInput.value.click()
    }
}

const handleImportJSON = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
        try {
            const songData = JSON.parse(e.target.result)
            await processImport(songData)
        } catch (error) {
            notification.addToast('El archivo no es un JSON válido', 'error')
        }
    }
    reader.readAsText(file)
}

const processImport = async (songData, overwrite = false) => {
    try {
        // Acceder directamente al registro a través de métodos que sabemos que existen
        const registry = store.getSongsRegistry()
        if (!registry.songs) registry.songs = {}

        if (registry.songs[songData.id] && !overwrite) {
            const overwriteConfirm = await askConfirm({
                title: 'Reemplazar canción',
                message: `Ya existe «${songData.name}» en la biblioteca. Se sustituirá por la canción del archivo importado.`,
                confirmText: 'Reemplazar canción',
                isDanger: true
            })
            if (overwriteConfirm) {
                await processImport(songData, true)
            }
            return
        }

        // Validación mínima
        if (!songData.id || !songData.header || !songData.body) {
             throw new Error('Formato de canción inválido')
        }

        // Guardar
        registry.songs[songData.id] = songData
        store.saveSongsRegistry(registry)
        
        notification.addToast('Canción importada correctamente', 'success')
        
        // Cargar inmediatamente la canción importada y cerrar el modal
        store.loadSong(songData.id)
        showImportModal.value = false
        selectedSongId.value = songData.id

    } catch (error) {
        console.error('Error importing:', error)
        notification.addToast('Error al importar: ' + error.message, 'error')
    }
}

// Global DB Backup/Restore
const downloadCompleteBackup = async () => {
    try {
        const fullDatabase = store.exportCompleteDatabase()
        const dateTime = formatDateForFileName(new Date())
        const fileName = `VueGroupSheet_Backup_${dateTime}.backup`

        const blob = new Blob([JSON.stringify(fullDatabase, null, 2)], { type: 'application/json' })
        await saveFile(blob, fileName)
    } catch (error) {
        console.error('Error exportando Backup:', error)
        notification.addToast('Error al generar el Backup: ' + error.message, 'error')
    }
}

const triggerImportBackup = () => {
    if (fileInputGlobal.value) {
        fileInputGlobal.value.value = ''
        fileInputGlobal.value.click()
    }
}

const handleImportBackup = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
        try {
            const registryData = JSON.parse(e.target.result)
            
            const mode = await chooseBackupImport(askConfirm)
            if (mode === null) return

            store.importCompleteDatabase(registryData, mode)
            
            notification.addToast(
                mode ? 'Base de datos fusionada con éxito.' : 'Base de datos restaurada desde cero con éxito.',
                'success'
            )

        } catch (error) {
            console.error('Error parsing backup:', error)
            notification.addToast('No se pudo importar el backup: ' + error.message, 'error')
        }
    }
    reader.readAsText(file)
}

const selectImport = (type) => {
    showImportModal.value = false
    if (type === 'song') {
        triggerImportJSON()
    } else {
        triggerImportBackup()
    }
}

const selectExport = (type) => {
    showExportModal.value = false
    if (type === 'song') {
        exportJSON()
    } else if (type === 'all') {
        downloadCompleteBackup()
    } else if (type === 'musicxml') {
        exportMusicXML()
    }
}

const exportMusicXML = async () => {
  try {
    const { MusicXMLGenerator } = await import('../utils/MusicXMLGenerator.js')
    const generator = new MusicXMLGenerator({
      header: store.header,
      body: store.body,
      structure: store.structure,
      settings: store.settings
    })
    
    const xml = generator.generate()
    const fileName = getExportFileName()
    const blob = new Blob([xml], { type: 'application/xml' })
    await saveFile(blob, `${fileName}.musicxml`)
    
    notification.addToast('Exportación MusicXML completada', 'success')
  } catch (error) {
    console.error('Error exportando MusicXML:', error)
    notification.addToast('Error al exportar MusicXML: ' + error.message, 'error')
  }
}

function collapseLyricsBlockLineBreaks(script) {
  const lines = script.split('\n')
  const output = []
  let currentBlock = null
  let currentLyricLine = null

  const flushLyricLine = () => {
    if (currentLyricLine === null) return
    output.push(currentLyricLine)
    currentLyricLine = null
  }

  for (const sourceLine of lines) {
    const rawLine = sourceLine.replace(/\r$/, '')
    const trimmed = rawLine.trim()
    const trimmedStart = rawLine.trimStart()

    if (trimmed === 'Header:' || trimmed === 'Sections:' || trimmed === 'Structure:' || trimmed === 'Lyrics:') {
      flushLyricLine()
      currentBlock = trimmed
      output.push(rawLine)
      continue
    }

    if (currentBlock !== 'Lyrics:') {
      output.push(rawLine)
      continue
    }

    const lyricMatch = trimmedStart.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=(.*)$/)
    if (lyricMatch) {
      flushLyricLine()
      currentLyricLine = `${lyricMatch[1]}=${lyricMatch[2]}`
      continue
    }

    if (currentLyricLine !== null) {
      currentLyricLine += `${SCRIPT_INLINE_LYRIC_BREAK}${rawLine}`
      continue
    }

    output.push(rawLine)
  }

  flushLyricLine()

  return output.join('\n')
}
defineExpose({ openLibrary: openLoadDialog, openSong: loadSong, openSave: openSaveDialog })
</script>
