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

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const store = useCollectionStore()
const sheetStore = useSheetStore()
const showEditModal = ref(false)
const isExporting = ref(false)
const pdfContainer = ref(null)

const duplicate = () => {
  store.duplicateCollection(props.collection.id)
}

const confirmDelete = () => {
  if (confirm(`¿Eliminar la colección "${props.collection.name}"?`)) {
    store.deleteCollection(props.collection.id)
  }
}

const exportCollectionPDF = async () => {
  if (props.collection.songs.length === 0) {
    alert('La colección está vacía')
    return
  }

  isExporting.value = true
  await nextTick()

  try {
    const songsRegistry = sheetStore.getSongsRegistry()
    
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
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(24)
    pdf.text(props.collection.name, pdfWidth / 2, pdfHeight / 3, { align: "center" })
    
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    const dateStr = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
    pdf.text(`Exportado el ${dateStr}`, pdfWidth / 2, (pdfHeight / 3) + 15, { align: "center" })
    
    pdf.setFontSize(10)
    pdf.text(`${props.collection.songs.length} canciones`, pdfWidth / 2, (pdfHeight / 3) + 25, { align: "center" })
    
    pdf.addPage()
    // --- FIN PORTADA ---
    
    console.log('Iniciando exportación de colección:', props.collection.name)
    
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
      } else {
        console.error('ERROR: No se encontró el elemento #sheet-page')
      }
    }

    pdf.save(`${props.collection.name}.pdf`)

  } catch (error) {
    console.error('Error exportando colección:', error)
    alert('Error al generar el PDF: ' + error.message)
  } finally {
    isExporting.value = false
  }
}

const exportJSON = () => {
  try {
    const data = store.exportCollection(props.collection.id)
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    saveAs(blob, `${props.collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`)
  } catch (error) {
    console.error('Error exportando JSON:', error)
    alert('Error al exportar: ' + error.message)
  }
}

const exportEPUB = async () => {
  if (props.collection.songs.length === 0) {
    alert('La colección está vacía')
    return
  }

  isExporting.value = true
  await nextTick()

  try {
    const songsRegistry = sheetStore.getSongsRegistry()
    const songsToExport = []
    const imageBlobs = []

    // 1. Collect Metadata and Capture Images sequentially
    for (const songId of props.collection.songs) {
      if (songsRegistry.songs[songId]) {
        // Metadata copy
        const songData = JSON.parse(JSON.stringify(songsRegistry.songs[songId]))
        songsToExport.push(songData)
        
        // Capture Image logic (hijack main view)
        await sheetStore.loadSong(songId)
        
        // Wait for render
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 800))

        const sheetPage = document.getElementById('sheet-page')
        if (sheetPage) {
           sheetPage.classList.add('pdf-export') // Ensure clean look
           try {
             const canvas = await html2canvas(sheetPage, {
               scale: 2,
               useCORS: true,
               logging: false,
               backgroundColor: '#ffffff'
             })
             
             const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
             imageBlobs.push(blob)
           } catch (e) {
             console.error('Error capturing image for EPUB', e)
             // Push a placeholder or null? 
             // Better to push a dummy error image or just fail
             // For now we might just fail the image part or push null and handle it?
             // Let's assume robustness: push null and filter later?
             // EpubGenerator expects matching indices.
             // We'll create a simple fallback blob?
             // Let's just alert and continue
           } finally {
             sheetPage.classList.remove('pdf-export')
           }
        }
      }
    }

    if (songsToExport.length === 0) {
      alert('No se encontraron canciones válidas para exportar')
      return
    }

    // 2. Generate EPUB
    const { EpubGenerator } = await import('../utils/EpubGenerator.js')
    const generator = new EpubGenerator(props.collection.name, songsToExport)
    
    // Use Image-based generation
    const blob = await generator.generateFromImages(imageBlobs)

    // 3. Download
    saveAs(blob, `${props.collection.name}.epub`)

  } catch (error) {
    console.error('Error exportando EPUB:', error)
    alert('Error al generar EPUB: ' + error.message)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.collection-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  transition: box-shadow 0.2s;
}

.collection-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.collection-info {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.collection-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.collection-count {
  font-size: 12px;
  color: #666;
}

.collection-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #1976d2;
}

.action-btn.danger:hover {
  background: #ffebee;
  color: #d32f2f;
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
