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
    <button @click="openLoadDialog" title="Abrir Canción" class="toolbar-btn">
      <span class="material-icons">folder_open</span>
      <span class="btn-label">Abrir</span>
    </button>
    <button @click="exportPDF" title="Exportar PDF" class="toolbar-btn">
      <span class="material-icons">picture_as_pdf</span>
      <span class="btn-label">PDF</span>
    </button>
    <button @click="exportEPUB" title="Exportar EPUB" class="toolbar-btn">
      <span class="material-icons">book</span>
      <span class="btn-label">EPUB</span>
    </button>
    <button @click="print" title="Imprimir" class="toolbar-btn">
      <span class="material-icons">print</span>
      <span class="btn-label">Imprimir</span>
    </button>
    <button @click="showExportModal = true" title="Exportar..." class="toolbar-btn">
      <span class="material-icons">file_upload</span>
      <span class="btn-label">Exportar</span>
    </button>
    <button @click="showImportModal = true" title="Importar..." class="toolbar-btn">
      <span class="material-icons">file_download</span>
      <span class="btn-label">Importar</span>
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept=".gse,.json"
        @change="handleImportJSON"
      />
      <input 
        type="file" 
        ref="fileInputGlobal" 
        style="display: none" 
        accept=".backup,.gse,.json"
        @change="handleImportBackup"
      />
    </button>
    <div style="height: 1px; background: var(--ui-border); width: 80%; margin: 8px auto;"></div>
    <button @click="openSettings" title="Configuración" class="toolbar-btn">
      <span class="material-icons">settings</span>
      <span class="btn-label">Ajustes</span>
    </button>
    <button @click="openHelp" title="Ayuda" class="toolbar-btn">
      <span class="material-icons">help_outline</span>
      <span class="btn-label">Ayuda</span>
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
    
    <!-- Modal Abrir Canción -->
    <Teleport to="#modal-container">
      <div v-if="showLoadDialog" class="modal-overlay" @click.self="showLoadDialog = false">
        <div class="modal-content" style="max-width: 800px; width: 90%;">
        <div class="modal-header">Abrir Canción</div>
        <div class="modal-body">
          <div class="dialog-filters" style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
            <input type="text" v-model="searchQuery" placeholder="Buscar por título o autor..." class="search-input" style="flex: 1; min-width: 200px; padding: 10px; border-radius: 4px; border: 1px solid var(--ui-border); background: var(--ui-bg-input); color: var(--ui-text-secondary);" />
            <select v-model="sortBy" class="sort-select" style="padding: 10px; border-radius: 4px; border: 1px solid var(--ui-border); background: var(--ui-bg-input); color: var(--ui-text-secondary);">
              <option value="date">Más recientes</option>
              <option value="alpha">Alfabético</option>
            </select>
            <select v-model="filterCollection" class="collection-select" style="padding: 10px; border-radius: 4px; border: 1px solid var(--ui-border); background: var(--ui-bg-input); color: var(--ui-text-secondary);">
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
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="showLoadDialog = false">Cerrar</button>
          <button class="primary" :disabled="!selectedSongId" @click="loadSelectedSong">Abrir</button>
        </div>
        </div>
      </div>
    </Teleport>
    
    <Teleport to="#modal-container">
      <SettingsModal v-if="showSettings" @close="showSettings = false"></SettingsModal>
      <HelpModal v-if="showHelp" @close="showHelp = false" />
      <ConfirmDialog
        v-model="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :confirmText="confirmState.confirmText"
        :isDanger="confirmState.isDanger"
        @confirm="confirmState.onConfirm"
        @cancel="confirmState.onCancel"
      />

      <!-- Modal Selección Importación -->
      <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
        <div class="modal-content">
          <div class="modal-header">Importar Datos</div>
          <div class="modal-body">
            <div class="songs-list">
              <div class="song-item" @click="selectImport('song')">
                <div class="song-info">
                  <div class="song-name">Canción</div>
                  <div class="song-author">Sesión Individual</div>
                  <div class="song-date">Importar un archivo de canción (.gse o .json)</div>
                </div>
                <div class="song-actions">
                  <span class="material-icons" style="color: var(--ui-text-secondary)">description</span>
                </div>
              </div>
              <div class="song-item" @click="selectImport('all')">
                <div class="song-info">
                  <div class="song-name">Todo (Restaurar)</div>
                  <div class="song-author">Base de Datos Completa</div>
                  <div class="song-date">Restaurar o fusionar toda la base de datos completa</div>
                </div>
                <div class="song-actions">
                  <span class="material-icons" style="color: var(--ui-danger)">storage</span>
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
      <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
        <div class="modal-content">
          <div class="modal-header">Exportar Datos</div>
          <div class="modal-body">
            <div class="songs-list">
              <div class="song-item" @click="selectExport('song')">
                <div class="song-info">
                  <div class="song-name">{{ store.header?.center?.top?.name || 'Canción Actual' }}</div>
                  <div v-if="store.header?.center?.bottom?.author" class="song-author">{{ store.header.center.bottom.author }}</div>
                  <div class="song-date">Exportar esta canción en formato nativo (.gse)</div>
                </div>
                <div class="song-actions">
                  <span class="material-icons" style="color: var(--ui-text-secondary)">description</span>
                </div>
              </div>
              <div class="song-item" @click="selectExport('all')">
                <div class="song-info">
                  <div class="song-name">Todo (Copia Seguridad)</div>
                  <div class="song-author">Backup Completo</div>
                  <div class="song-date">Descargar un backup de todas las canciones y colecciones</div>
                </div>
                <div class="song-actions">
                  <span class="material-icons" style="color: var(--ui-primary)">cloud_download</span>
                </div>
              </div>
              <div class="song-item" @click="selectExport('musicxml')">
                <div class="song-info">
                  <div class="song-name">MusicXML</div>
                  <div class="song-author">Formato Estándar</div>
                  <div class="song-date">Exportar para MuseScore, Sibelius, etc.</div>
                </div>
                <div class="song-actions">
                  <span class="material-icons" style="color: var(--ui-accent)">music_note</span>
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
import { ref, computed, nextTick, onMounted } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import { useCollectionStore } from '../stores/collectionStore'
import SettingsModal from './SettingsModal.vue'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import { saveAs as saveFile } from 'file-saver'
import md5 from 'md5'
import HelpModal from './HelpModal.vue'
import { useNotificationStore } from '../stores/notificationStore'
import ConfirmDialog from './UI/ConfirmDialog.vue'

const store = useSheetStore()
const collectionStore = useCollectionStore()
const notification = useNotificationStore()
const showHelp = ref(false)
const showSettings = ref(false)
const showSaveDialog = ref(false)
const showLoadDialog = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)
const selectedSongId = ref(null)
const songName = ref('')
const fileInput = ref(null)
const fileInputGlobal = ref(null)

const searchQuery = ref('')
const sortBy = ref('date')
const filterCollection = ref('')

const confirmState = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Aceptar',
  isDanger: false,
  onConfirm: () => {},
  onCancel: () => {}
})

const showConfirm = (options) => {
  confirmState.value = {
    show: true,
    title: options.title || 'Confirmar',
    message: options.message || '¿Estás seguro?',
    confirmText: options.confirmText || 'Aceptar',
    isDanger: options.isDanger || false,
    onConfirm: options.onConfirm || (() => {})
  }
}

const askConfirm = (options) => {
  return new Promise((resolve) => {
    const originalOnConfirm = options.onConfirm
    confirmState.value = {
      show: true,
      title: options.title || 'Confirmar',
      message: options.message || '¿Estás seguro?',
      confirmText: options.confirmText || 'Aceptar',
      isDanger: options.isDanger || false,
      onConfirm: () => {
        if (originalOnConfirm) originalOnConfirm()
        resolve(true)
      },
      onCancel: () => resolve(false)
    }
  })
}

const openSettings = () => {
  showSettings.value = true
}

const openHelp = () => {
  showHelp.value = true
}

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

const openLoadDialog = () => {
  collectionStore.loadCollections()
  searchQuery.value = ''
  filterCollection.value = ''
  sortBy.value = 'date'
  showLoadDialog.value = true
}

const newFile = () => {
  showConfirm({
    title: 'Nuevo Archivo',
    message: '¿Crear un nuevo archivo? Se perderán los cambios no guardados.',
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
    title: 'Abrir Canción',
    message: `¿Abrir la canción "${name}"? Se perderán los cambios no guardados.`,
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
    title: 'Eliminar Canción',
    message: `¿Eliminar la canción "${name}"? Esta acción no se puede deshacer.`,
    isDanger: true,
    confirmText: 'Eliminar',
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

// Rewriting exportPDF to use explicit html2canvas + jsPDF
const exportPDF = async () => {
    const sheetPage = document.getElementById('sheet-page')
    if (!sheetPage) {
        notification.addToast('No se encontró el contenido de la página para exportar', 'error')
        return
    }

    try {
        let fileName = getExportFileName()
        let includeLyrics = false

        // Check if lyrics are available/enabled and ask user
        if (store.settings.show_lyrics) {
            includeLyrics = await askConfirm({
                title: 'Exportar PDF',
                message: '¿Incluir las letras en la exportación?'
            })
            if (includeLyrics) {
                fileName += '_LETRAS'
            }
        }

        sheetPage.classList.add('pdf-export')
        // Quitar indicadores visuales A4 para evitar que box-shadow/outline agrande el canvas
        const hadInBounds = sheetPage.classList.contains('in-bounds')
        const hadOutOfBounds = sheetPage.classList.contains('out-of-bounds')
        sheetPage.classList.remove('in-bounds', 'out-of-bounds')

        // Forzar min-height/outline/box-shadow a 0 via inline style (mayor prioridad que cualquier CSS).
        const prevMinHeight = sheetPage.style.minHeight
        const prevOutline = sheetPage.style.outline
        const prevBoxShadow = sheetPage.style.boxShadow
        sheetPage.style.minHeight = 'auto'
        sheetPage.style.outline = 'none'
        sheetPage.style.boxShadow = 'none'

        // Esperar un tick para que el DOM refleje el nuevo tamaño antes de capturar
        await nextTick()
        
        // Setup PDF
        const opt = {
             margin: 0,
             filename: `${fileName}.pdf`,
             image: { type: 'jpeg', quality: 0.98 },
             html2canvas: { scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff', scrollY: -window.scrollY },
             jsPDF: { unit: 'mm', format: 'a4', orientation: store.settings.page_orientation === 'V' ? 'portrait' : 'landscape', compress: true }
        }

    // Generate Worker
        const worker = html2pdf().set(opt).from(sheetPage).toPdf()
        
        // Wait for first page to be added to PDF
        await worker.get('pdf').then(async (doc) => {
             // Now check for lyrics ONLY if user agreed
             if (includeLyrics) {
                 const lyricsPage = document.getElementById('lyrics-page')
                 
                 if (lyricsPage) {
                     lyricsPage.classList.add('pdf-export')
                     try {
                         const canvas = await html2canvas(lyricsPage, {
                            scale: 3,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff',
                            scrollY: -window.scrollY
                         })
                         
                         const imgData = canvas.toDataURL('image/jpeg', 0.98)
                         
                         // Get dimensions from the PDF document context
                         const pageSize = doc.internal.pageSize
                         const pageWidth = pageSize.getWidth()
                         const pageHeight = pageSize.getHeight() 
                         
                         const imgProps = doc.getImageProperties(imgData)
                         const imgRatio = imgProps.width / imgProps.height
                         
                         // Calculate width-based dimensions first (Match Page Width)
                         let printWidth = pageWidth
                         let printHeight = printWidth / imgRatio
                         
                         // Check if height overflows page
                         if (printHeight > pageHeight) {
                            // Scale to fit height instead
                            printHeight = pageHeight
                            printWidth = printHeight * imgRatio
                         }
    
                         // Calculate Centering (if width is less than page width)
                         const xOffset = (pageWidth - printWidth) / 2
                         const yOffset = 0 // Top alignment
    
                         doc.addPage()
                         doc.addImage(imgData, 'JPEG', xOffset, yOffset, printWidth, printHeight)
                     } catch (e) {
                         console.error("Error capturing lyrics:", e)
                     } finally {
                         lyricsPage.classList.remove('pdf-export')
                     }
                 }
             }
             
             // Manual save after modification
             doc.save(`${fileName}.pdf`)
        })

    } catch (error) {
        console.error('Error generating PDF:', error)
        notification.addToast('Error al generar el PDF: ' + error.message, 'error')
    } finally {
        sheetPage.classList.remove('pdf-export')
        sheetPage.style.minHeight = prevMinHeight
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
            includeLyrics = await askConfirm({
                title: 'Exportar EPUB',
                message: '¿Incluir las letras en la exportación?'
            })
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
        try {
            const canvas = await html2canvas(sheetPage, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                scrollY: -window.scrollY
            })
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
            
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
                    const canvas = await html2canvas(lyricsPage, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        scrollY: -window.scrollY
                    })
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
                    
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
        saveFile(blob, `${fileName}.epub`)

    } catch (error) {
        console.error('Error exportando EPUB:', error)
        notification.addToast('Error al generar EPUB: ' + error.message, 'error')
    }
}

const exportJSON = () => {
  try {
    const fileName = getExportFileName()
    const now = new Date().toISOString()
    
    // Si no hay ID (canción nueva no guardada), generamos uno temporal para el archivo
    let exportId = store.currentSongId
    if (!exportId) {
        exportId = md5(now)
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
    saveFile(blob, `${fileName}.gse`)
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
                title: 'Sobrescribir Canción',
                message: `La canción "${songData.name}" ya existe. ¿Deseas sobrescribirla?`
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
const downloadCompleteBackup = () => {
    try {
        const fullDatabase = store.exportCompleteDatabase()
        const dateTime = formatDateForFileName(new Date())
        const fileName = `VueGroupSheet_Backup_${dateTime}.backup`

        const blob = new Blob([JSON.stringify(fullDatabase, null, 2)], { type: 'application/json' })
        saveFile(blob, fileName)
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
            
            // Confirmación Estricta Multi-Nivel
            const mode = await askConfirm({
                title: 'Restaurar Base de Datos',
                message: '¡CUIDADO! Estás a punto de importar una base de datos de respaldo completa.<br><br>' +
                         '¿Deseas <b>FUSIONAR</b> esta base con tus canciones actuales (Aceptar) ' +
                         'o <b>SOBRESCRIBIR</b> y perder todo el contenido local actual (Cancelar)?'
            })
            
            if (!mode) {
                // If cancelled the merge (so wants to overwrite), let's ask for definitive confirmation
                const definitive = await askConfirm({
                    title: '¡ACCIÓN IRREVERSIBLE!',
                    message: '¿ESTÁS ABSOLUTAMENTE SEGURO de que quieres borrar toda la base de datos local? No podrás deshacer esto.',
                    isDanger: true,
                    confirmText: 'Borrar y Sobrescribir'
                })
                
                if (!definitive) return
            }

            // mode: true = fusionar, false = destrutivo/sobrescribir
            store.importCompleteDatabase(registryData, mode)
            
            notification.addToast(
                mode ? 'Base de datos fusionada con éxito.' : 'Base de datos restaurada desde cero con éxito.',
                'success'
            )

        } catch (error) {
            console.error('Error parsing backup:', error)
            notification.addToast('El archivo no pudo leerse correctamente o no es un JSON estructurado.', 'error')
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
    saveFile(blob, `${fileName}.musicxml`)
    
    notification.addToast('Exportación MusicXML completada', 'success')
  } catch (error) {
    console.error('Error exportando MusicXML:', error)
    notification.addToast('Error al exportar MusicXML: ' + error.message, 'error')
  }
}
</script>



