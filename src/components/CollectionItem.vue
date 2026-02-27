<template>
  <div class="collection-item">
    <div class="collection-info">
      <span class="collection-name">{{ collection.name }}</span>
      <span class="collection-count">{{ collection.songs.length }} canciones</span>
    </div>
    
    <div class="collection-actions">
      <button @click="showEditModal = true" title="Editar" class="action-btn">
        <span class="material-icons">edit</span>
      </button>
      <button @click="duplicate" title="Duplicar" class="action-btn">
        <span class="material-icons">content_copy</span>
      </button>
      <button @click="exportJSON" title="Exportar JSON" class="action-btn">
        <span class="material-icons">file_download</span>
      </button>
      <button @click="exportCollectionPDF" title="Exportar PDF" class="action-btn" :disabled="isExporting">
        <span class="material-icons">{{ isExporting ? 'hourglass_empty' : 'picture_as_pdf' }}</span>
      </button>
      <button @click="exportEPUB" title="Exportar EPUB" class="action-btn" :disabled="isExporting">
        <span class="material-icons">book</span>
      </button>
      <button @click="confirmDelete" title="Eliminar" class="action-btn danger">
        <span class="material-icons">delete</span>
      </button>
    </div>

    <Teleport to="#modal-container">
      <CollectionEditModal 
        v-if="showEditModal" 
        :collection="collection" 
        @close="showEditModal = false" 
      />
      <ConfirmDialog
        v-model="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :confirmText="confirmState.confirmText"
        :isDanger="confirmState.isDanger"
        @confirm="confirmState.onConfirm"
        @cancel="confirmState.onCancel"
      />
    </Teleport>

    <!-- Contenedor oculto para exportación PDF -->
    <div v-if="isExporting" class="pdf-export-container" ref="pdfContainer">
      <!-- Aquí se renderizarán las canciones dinámicamente -->
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'
import CollectionEditModal from './CollectionEditModal.vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import { useNotificationStore } from '../stores/notificationStore'
import ConfirmDialog from './UI/ConfirmDialog.vue'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const store = useCollectionStore()
const sheetStore = useSheetStore()
const notification = useNotificationStore()
const showEditModal = ref(false)
const isExporting = ref(false)
const pdfContainer = ref(null)

const confirmState = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Aceptar',
  isDanger: false,
  onConfirm: () => {},
  onCancel: () => {}
})

const askConfirm = (options) => {
  return new Promise((resolve) => {
    confirmState.value = {
      show: true,
      title: options.title || 'Confirmar',
      message: options.message || '¿Estás seguro?',
      confirmText: options.confirmText || 'Aceptar',
      isDanger: options.isDanger || false,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    }
  })
}

const duplicate = () => {
  store.duplicateCollection(props.collection.id)
}

const confirmDelete = async () => {
  const confirmed = await askConfirm({
    title: 'Eliminar Colección',
    message: `¿Eliminar la colección "${props.collection.name}"?`,
    isDanger: true,
    confirmText: 'Eliminar'
  })
  
  if (confirmed) {
    store.deleteCollection(props.collection.id)
    notification.addToast('Colección eliminada', 'info')
  }
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
    const name = (props.collection.name || 'coleccion').replace(/[^a-z0-9áéíóúñ_\- ]/gi, '').trim()
    const dateTime = formatDateForFileName(new Date())
    return `${name}_${dateTime}`
}

const exportCollectionPDF = async () => {
  if (props.collection.songs.length === 0) {
    notification.addToast('La colección está vacía', 'warning')
    return
  }

  isExporting.value = true
  await nextTick()

  try {
    const songsRegistry = sheetStore.getSongsRegistry()
    
    // Recopilar metadatos de todas las canciones primero
    const coverList = []
    for (const songId of props.collection.songs) {
      if (songsRegistry.songs[songId]) {
        const s = songsRegistry.songs[songId]
        const name = s.header?.center?.top?.name || 'Sin nombre'
        const author = s.header?.center?.bottom?.author || 'Desconocido'
        coverList.push(`${name} - ${author}`)
      }
    }

    // Inicializar documento PDF (A4, Portrait, mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // --- PORTADA ---
    let yPos = pdfHeight / 3 - 20
    
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(24)
    pdf.text(props.collection.name, pdfWidth / 2, yPos, { align: "center" })
    yPos += 15

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    const dateStr = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
    pdf.text(`Exportado el ${dateStr}`, pdfWidth / 2, yPos, { align: "center" })
    yPos += 10
    
    pdf.setFontSize(10)
    pdf.text(`${props.collection.songs.length} canciones`, pdfWidth / 2, yPos, { align: "center" })
    yPos += 20

    // LISTA DE CANCIONES (TOC)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    
    coverList.forEach((item, index) => {
      // Simple pagination check for cover? 
      // For now assume it fits or user accepts overflow on simple covers.
      // If we go past page, we stop (simple MVP)
      if (yPos < pdfHeight - 20) {
        pdf.text(item, pdfWidth / 2, yPos, { align: "center" })
        yPos += 7
      }
    })
    
    pdf.addPage()
    // --- FIN PORTADA ---
    
    // --- FIN PORTADA ---
    
    // --- FIN PORTADA ---
    
    console.log('Iniciando exportación de colección:', props.collection.name)
    
    // Preguntar por letras una sola vez al inicio
    const includeLyrics = await askConfirm({
        title: 'Exportar Letras',
        message: '¿Incluir las letras (si están disponibles) en la exportación?'
    })

    for (let i = 0; i < props.collection.songs.length; i++) {
      const songId = props.collection.songs[i]
      console.log(`Procesando canción ${i + 1}/${props.collection.songs.length} (ID: ${songId})`)
      
      const songData = songsRegistry.songs[songId]
      if (!songData) {
        console.warn('Canción no encontrada en el registro:', songId)
        continue
      }

      // Cargar canción en el store
      await sheetStore.loadSong(songId)
      console.log('Canción cargada:', sheetStore.header.center.top.name)
      
      // Preparar datos del footer
      const nextSongId = i + 1 < props.collection.songs.length ? props.collection.songs[i + 1] : null
      const nextSongData = nextSongId ? songsRegistry.songs[nextSongId] : null
      
      const footerData = {
        current: i + 1,
        total: props.collection.songs.length,
        nextTitle: nextSongData ? (nextSongData.header?.center?.top?.name || 'Sin nombre') : null,
        nextAuthor: nextSongData ? (nextSongData.header?.center?.bottom?.author || '') : null
      }
      
      sheetStore.updateExportFooter(footerData)
      
      // Esperar a que Vue actualice el DOM
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 800)) // Wait for render
      
      const sheetPage = document.getElementById('sheet-page')
      if (sheetPage) {
        
        // Activar clase de exportación temporalmente
        sheetPage.classList.add('pdf-export')
        
        try {
          const canvas = await html2canvas(sheetPage, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollY: -window.scrollY,
            scrollX: -window.scrollX
          })
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95)
          const imgProps = pdf.getImageProperties(imgData)
          const imgRatio = imgProps.width / imgProps.height
          const printWidth = pdfWidth
          const printHeight = printWidth / imgRatio
          
          if (i > 0) {
            pdf.addPage()
          }
          
          pdf.addImage(imgData, 'JPEG', 0, 0, printWidth, printHeight)
          
        } catch (captureError) {
          console.error('Error capturando canción:', captureError)
        } finally {
          sheetPage.classList.remove('pdf-export')
        }
      }

      // 4. Capture Lyrics if present AND user wants them
      if (includeLyrics) {
        const lyricsPage = document.getElementById('lyrics-page')
        if (lyricsPage) {
          // Activar estilos de exportación también en la página de letras
          lyricsPage.classList.add('pdf-export')
          try {
             const canvas = await html2canvas(lyricsPage, {
              scale: 2, 
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              scrollY: -window.scrollY,
              scrollX: -window.scrollX
            })
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95)
            const imgProps = pdf.getImageProperties(imgData)
            const imgRatio = imgProps.width / imgProps.height
            const printWidth = pdfWidth
            const printHeight = printWidth / imgRatio
            
            pdf.addPage()
            pdf.addImage(imgData, 'JPEG', 0, 0, printWidth, printHeight)
  
          } catch (e) {
            console.error('Error capturing lyrics:', e)
          } finally {
            lyricsPage.classList.remove('pdf-export')
          }
        }
      }
    }
    
    // Limpiar footer al finalizar
    sheetStore.updateExportFooter(null)

    let fileName = getExportFileName()
    if (includeLyrics) {
        fileName += '_LETRAS'
    }
    pdf.save(`${fileName}.pdf`)

  } catch (error) {
    console.error('Error exportando colección:', error)
    notification.addToast('Error al generar el PDF: ' + error.message, 'error')
    // Asegurar limpieza en caso de error
    sheetStore.updateExportFooter(null)
  } finally {
    isExporting.value = false
  }
}

const exportJSON = () => {
  try {
    const data = store.exportCollection(props.collection.id)
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const fileName = getExportFileName()
    saveAs(blob, `${fileName}.json`)
    notification.addToast('Colección exportada', 'success')
  } catch (error) {
    console.error('Error exportando JSON:', error)
    notification.addToast('Error al exportar: ' + error.message, 'error')
  }
}

const exportEPUB = async () => {
  if (props.collection.songs.length === 0) {
    notification.addToast('La colección está vacía', 'warning')
    return
  }

  isExporting.value = true
  await nextTick()

  try {
    const songsRegistry = sheetStore.getSongsRegistry()
    const songsToExport = []
    const imageBlobs = []

    // Preguntar por letras una sola vez al inicio
    const includeLyrics = await askConfirm({
        title: 'Exportar Letras',
        message: '¿Incluir las letras (si están disponibles) en la exportación?'
    })
    if (includeLyrics) {
        includeLyrics = true
    }

    // 1. Collect Metadata and Capture Images sequentially
    for (const songId of props.collection.songs) {
      if (songsRegistry.songs[songId]) {
        // Metadata copy
        const songData = JSON.parse(JSON.stringify(songsRegistry.songs[songId]))
        
        // Capture Image logic (hijack main view)
        await sheetStore.loadSong(songId)
        
        // Wait for render
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 800))

        const sheetPage = document.getElementById('sheet-page')
        if (sheetPage) {
           sheetPage.classList.add('pdf-export') // Ensure clean look
           try {
             // 1. Capture Sheet
             const canvas = await html2canvas(sheetPage, {
               scale: 2,
               useCORS: true,
               logging: false,
               backgroundColor: '#ffffff'
             })
             
             const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
             
             // Add Sheet to lists
             songsToExport.push(songData)
             imageBlobs.push(blob)

           } catch (e) {
             console.error('Error capturing image for EPUB', e)
           } finally {
             sheetPage.classList.remove('pdf-export')
           }
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
                   backgroundColor: '#ffffff'
                 })
                 
                 const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
                 
                 // Add Lyrics to lists as a separate "song" entry
                 // Clone data but append (Letra) to name
                 const lyricData = JSON.parse(JSON.stringify(songData))
                 if (lyricData.header?.center?.top) {
                    lyricData.header.center.top.name = (lyricData.header.center.top.name || '') + ' (Letra)'
                 }
                 
                 songsToExport.push(lyricData)
                 imageBlobs.push(blob)
                 
               } catch (e) {
                 console.error('Error capturing lyrics for EPUB', e)
               } finally {
                 lyricsPage.classList.remove('pdf-export')
               }
            }
        }
      }
    }

    if (songsToExport.length === 0) {
      notification.addToast('No se encontraron canciones válidas para exportar', 'error')
      return
    }

    // 2. Generate EPUB
    const { EpubGenerator } = await import('../utils/EpubGenerator.js')
    const generator = new EpubGenerator(props.collection.name, songsToExport)
    
    // Use Image-based generation
    const blob = await generator.generateFromImages(imageBlobs)

    // 3. Download
    let fileName = `${props.collection.name}`
    if (includeLyrics) {
        fileName += '_LETRAS'
    }
    saveAs(blob, `${fileName}.epub`)

  } catch (error) {
    console.error('Error exportando EPUB:', error)
    notification.addToast('Error al generar EPUB: ' + error.message, 'error')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.collection-item {
  background: var(--ui-bg-surface);
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.collection-item:hover {
  background: var(--ui-bg-hover);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.collection-info {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.collection-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--ui-text-primary);
}

.collection-count {
  font-size: 12px;
  color: var(--ui-text-secondary);
}

.collection-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-btn {
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 6px;
  border-radius: 9999px;
  color: var(--ui-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: var(--ui-bg-hover);
  color: var(--ui-text-primary);
  border-color: rgba(255, 255, 255, 0.2);
  filter: brightness(1.2);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--ui-danger);
  border-color: rgba(239, 68, 68, 0.3);
}

.action-btn .material-icons {
  font-size: 20px;
}

.pdf-export-container {
  position: absolute;
  left: -10000px;
  top: 0;
  width: 210mm; /* A4 width */
  opacity: 1;
  background: white;
  z-index: -1000;
}
</style>
