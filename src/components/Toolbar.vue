<template>
  <div class="toolbar">
    <button @click="newFile" title="Nuevo Archivo" class="toolbar-btn">
      <span class="material-icons">note_add</span>
      <span class="btn-label">Nuevo</span>
    </button>
    <button @click="openSaveDialog" title="Guardar Como" class="toolbar-btn">
      <span class="material-icons">save</span>
      <span class="btn-label">Guardar</span>
    </button>
    <button @click="showLoadDialog = true" title="Cargar Canción" class="toolbar-btn">
      <span class="material-icons">folder_open</span>
      <span class="btn-label">Cargar</span>
    </button>
    <button @click="exportPDF" title="Exportar PDF" class="toolbar-btn">
      <span class="material-icons">picture_as_pdf</span>
      <span class="btn-label">PDF</span>
    </button>
    <button @click="print" title="Imprimir" class="toolbar-btn">
      <span class="material-icons">print</span>
      <span class="btn-label">Imprimir</span>
    </button>
    <button @click="openSettings" title="Configuración" class="toolbar-btn">
      <span class="material-icons">settings</span>
      <span class="btn-label">Ajustes</span>
    </button>
    
    <!-- Modal Guardar Como -->
    <Teleport to="#modal-container">
      <div v-if="showSaveDialog" class="modal-overlay" @click.self="showSaveDialog = false">
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
          <button class="primary" @click="saveAs">Guardar</button>
        </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Modal Cargar Canción -->
    <Teleport to="#modal-container">
      <div v-if="showLoadDialog" class="modal-overlay" @click.self="showLoadDialog = false">
        <div class="modal-content">
        <div class="modal-header">Cargar Canción</div>
        <div class="modal-body">
          <div v-if="songsList.length === 0" style="padding: 20px; text-align: center; color: #666;">
            No hay canciones guardadas
          </div>
          <div v-else class="songs-list">
            <div 
              v-for="song in songsList" 
              :key="song.id"
              class="song-item"
              :class="{ selected: selectedSongId === song.id }"
              @click="selectSong(song.id)"
            >
              <div class="song-info">
                <div class="song-name">{{ song.name }}</div>
                <div class="song-date">{{ formatDate(song.updatedAt || song.createdAt) }}</div>
              </div>
              <div class="song-actions">
                <button @click.stop="deleteSong(song.id)" class="delete-btn-small" title="Eliminar">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="showLoadDialog = false">Cerrar</button>
          <button class="primary" :disabled="!selectedSongId" @click="loadSelectedSong">Cargar</button>
        </div>
        </div>
      </div>
    </Teleport>
    
    <Teleport to="#modal-container">
      <SettingsModal v-if="showSettings" @close="showSettings = false" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import SettingsModal from './SettingsModal.vue'
import html2pdf from 'html2pdf.js'

const store = useSheetStore()
const showSettings = ref(false)
const showSaveDialog = ref(false)
const showLoadDialog = ref(false)
const selectedSongId = ref(null)
const songName = ref('')

const songsList = computed(() => store.getSongsList())

const newFile = () => {
  if (confirm('¿Crear un nuevo archivo? Se perderán los cambios no guardados.')) {
    store.newFile()
  }
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
    alert('Por favor, introduce un nombre para la canción')
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
    
    alert(`Canción "${nameToSave}" guardada correctamente`)
    songName.value = ''
    showSaveDialog.value = false
  } catch (error) {
    alert('Error al guardar: ' + error.message)
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

  if (confirm(`¿Cargar la canción "${name}"? Se perderán los cambios no guardados.`)) {
    try {
      store.loadSong(id)
      showLoadDialog.value = false
    } catch (error) {
      alert('Error al cargar: ' + error.message)
    }
  }
}

const deleteSong = (id) => {
  const song = findSongById(id)
  const name = song?.name || 'sin nombre'

  if (confirm(`¿Eliminar la canción "${name}"? Esta acción no se puede deshacer.`)) {
    store.deleteSong(id)
    if (selectedSongId.value === id) {
      selectedSongId.value = null
    }
  }
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

const exportPDF = () => {
  const element = document.getElementById('sheet-page')

  if (!element) {
    alert('No se encontró el contenido de la página para exportar')
    return
  }

  // Activar estilos específicos solo sobre el contenedor de la página
  element.classList.add('pdf-export')

  const opt = {
    margin: 0,
    filename: `${store.header.center.top.name || 'cancion'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 3,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: store.settings.page_orientation === 'V' ? 'portrait' : 'landscape',
      compress: true
    }
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      element.classList.remove('pdf-export')
    })
    .catch((error) => {
      console.error('Error generating PDF:', error)
      element.classList.remove('pdf-export')
      alert('Error al generar el PDF: ' + error.message)
    })
}

const print = () => {
  window.print()
}

const openSettings = () => {
  showSettings.value = true
}
</script>
