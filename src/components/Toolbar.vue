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
    <button @click="exportEPUB" title="Exportar EPUB" class="toolbar-btn">
      <span class="material-icons">book</span>
      <span class="btn-label">EPUB</span>
    </button>
    <button @click="print" title="Imprimir" class="toolbar-btn">
      <span class="material-icons">print</span>
      <span class="btn-label">Imprimir</span>
    </button>
    <button @click="exportJSON" title="Exportar Canción" class="toolbar-btn">
      <span class="material-icons">file_upload</span>
      <span class="btn-label">Exportar Canción</span>
    </button>
    <button @click="triggerImportJSON" title="Importar Canción" class="toolbar-btn">
      <span class="material-icons">file_download</span>
      <span class="btn-label">Importar Canción</span>
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept=".json"
        @change="handleImportJSON"
      />
    </button>
    <div style="height: 1px; background: var(--ui-border); width: 80%; margin: 8px auto;"></div>
    <button @click="downloadCompleteBackup" title="Exportar Todo" class="toolbar-btn">
      <span class="material-icons">cloud_download</span>
      <span class="btn-label">Exportar Todo</span>
    </button>
    <button @click="triggerImportBackup" title="Restaurar Todo" class="toolbar-btn" style="color: var(--ui-danger);">
      <span class="material-icons">cloud_upload</span>
      <span class="btn-label" style="color: var(--ui-danger);">Restaurar Todo</span>
      <input 
        type="file" 
        ref="fileInputGlobal" 
        style="display: none" 
        accept=".json"
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
    
    <!-- Modal Cargar Canción -->
    <Teleport to="#modal-container">
      <div v-if="showLoadDialog" class="modal-overlay" @click.self="showLoadDialog = false">
        <div class="modal-content">
        <div class="modal-header">Cargar Canción</div>
        <div class="modal-body">
          <div v-if="songsList.length === 0" style="padding: 20px; text-align: center; color: var(--ui-text-secondary);">
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
      <SettingsModal v-if="showSettings" @close="showSettings = false"></SettingsModal>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import SettingsModal from './SettingsModal.vue'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import { saveAs as saveFile } from 'file-saver'
import md5 from 'md5'

const store = useSheetStore()
const showSettings = ref(false)
const showSaveDialog = ref(false)
const showLoadDialog = ref(false)
const selectedSongId = ref(null)
const songName = ref('')
const fileInput = ref(null)
const fileInputGlobal = ref(null)

const openSettings = () => {
  showSettings.value = true
}

const openHelp = () => {
  alert('Ayuda no implementada aún')
}

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
        alert('No se encontró el contenido de la página para exportar')
        return
    }

    try {
        let fileName = getExportFileName()
        let includeLyrics = false

        // Check if lyrics are available/enabled and ask user
        if (store.settings.show_lyrics) {
            if (confirm('¿Incluir las letras en la exportación?')) {
                includeLyrics = true
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
        alert('Error al generar el PDF: ' + error.message)
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
            alert('No se encontró el contenido de la página para exportar')
            return
        }

        let fileName = getExportFileName()
        let includeLyrics = false

        // Check if lyrics are available/enabled and ask user
        if (store.settings.show_lyrics) {
            if (confirm('¿Incluir las letras en la exportación?')) {
                includeLyrics = true
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
        alert('Error al generar EPUB: ' + error.message)
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
    saveFile(blob, `${fileName}.json`)
  } catch (error) {
    console.error('Error exportando JSON:', error)
    alert('Error al exportar JSON: ' + error.message)
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
    reader.onload = (e) => {
        try {
            const songData = JSON.parse(e.target.result)
            processImport(songData)
        } catch (error) {
            alert('El archivo no es un JSON válido')
        }
    }
    reader.readAsText(file)
}

const processImport = (songData, overwrite = false) => {
    try {
        // Acceder directamente al registro a través de métodos que sabemos que existen
        const registry = store.getSongsRegistry()
        if (!registry.songs) registry.songs = {}

        if (registry.songs[songData.id] && !overwrite) {
            if (confirm(`La canción "${songData.name}" ya existe. ¿Deseas sobrescribirla?`)) {
                processImport(songData, true)
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
        
        alert('Canción importada correctamente')
        if (store.currentSongId === songData.id) {
            store.loadSong(songData.id)
        }

    } catch (error) {
        console.error('Error importing:', error)
        alert('Error al importar: ' + error.message)
    }
}

// Global DB Backup/Restore
const downloadCompleteBackup = () => {
    try {
        const fullDatabase = store.exportCompleteDatabase()
        const dateTime = formatDateForFileName(new Date())
        const fileName = `VueGroupSheet_Backup_${dateTime}.json`

        const blob = new Blob([JSON.stringify(fullDatabase, null, 2)], { type: 'application/json' })
        saveFile(blob, fileName)
    } catch (error) {
        console.error('Error exportando Backup:', error)
        alert('Error al generar el Backup: ' + error.message)
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
    reader.onload = (e) => {
        try {
            const registryData = JSON.parse(e.target.result)
            
            // Confirmación Estricta Multi-Nivel
            const mode = confirm(
                '¡CUIDADO! Estás a punto de importar una base de datos de respaldo completa.\n\n' +
                '¿Deseas FUSIONAR esta base con tus canciones actuales (presiona ACEPTAR) ' +
                'o SOBRESCRIBIR y perder todo el contenido local actual (presiona CANCELAR)?'
            )
            
            if (!mode) {
                // If cancelled the merge (so wants to overwrite), let's ask for definitive confirmation
                if (!confirm('¿ESTÁS ABSOLUTAMENTE SEGURO DE QUE QUIERES ELIMINAR TODAS TUS CANCIONES Y REEMPLAZARLAS POR LAS DEL ARCHIVO DE RESPALDO? Esta acción es irreversible.')) {
                    return // Aborta todo
                }
            }

            // mode: true = fusionar, false = destrutivo/sobrescribir
            store.importCompleteDatabase(registryData, mode)
            
            alert(mode ? 'Base de datos fusionada con éxito.' : 'Base de datos restaurada desde cero con éxito.')

        } catch (error) {
            console.error('Error parsing backup:', error)
            alert('El archivo no pudo leerse correctamente o no es un JSON estructurado.')
        }
    }
    reader.readAsText(file)
}
</script>



