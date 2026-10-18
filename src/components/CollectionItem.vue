<template>
  <div class="collection-item">
    <div class="collection-card-heading">
    <span class="collection-art"><AppIcon name="book" /></span>
    <div class="collection-info">
      <span class="collection-name">{{ collection.name }}</span>
      <span class="collection-count">{{ collection.songs.length }} {{ collection.songs.length === 1 ? 'canción' : 'canciones' }}</span>
    </div>
    <button type="button" class="collection-open" @click="showEditModal = true" :aria-label="`Editar colección ${collection.name}`" title="Editar colección"><AppIcon name="chevron_right" /></button>
    </div>
    <button v-if="integrityIssue" type="button" class="collection-integrity-warning" @click="store.integrityReportOpen = true">
      <AppIcon name="warning" /> {{ integrityIssue.missingSongs.length }} {{ integrityIssue.missingSongs.length === 1 ? 'referencia ausente' : 'referencias ausentes' }} · Revisar
    </button>
    
    <div class="collection-actions">
      <button @click="showEditModal = true" title="Editar" class="action-btn">
        <AppIcon name="edit" />
      </button>
      <button @click="duplicate" title="Duplicar" class="action-btn">
        <AppIcon name="content_copy" />
      </button>
      <button @click="exportJSON" title="Exportar .col" class="action-btn">
        <AppIcon name="file_download" />
      </button>
      <button @click="exportCollectionPDF" title="Exportar PDF" class="action-btn" :disabled="isExporting">
        <AppIcon :name="isExporting ? 'hourglass_empty' : 'picture_as_pdf'" />
      </button>
      <button @click="exportEPUB" title="Exportar EPUB" class="action-btn" :disabled="isExporting">
        <AppIcon name="book" />
      </button>
      <button @click="confirmDelete" title="Eliminar" class="action-btn danger">
        <AppIcon name="delete" />
      </button>
    </div>

    <Teleport to="#modal-container">
      <CollectionEditModal 
        v-if="showEditModal" 
        :collection="collection" 
        @close="showEditModal = false" 
      />
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
    </Teleport>

    <!-- Contenedor oculto para exportación PDF -->
    <div v-if="isExporting" class="pdf-export-container" ref="pdfContainer">
      <!-- Aquí se renderizarán las canciones dinámicamente -->
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'
import CollectionEditModal from './CollectionEditModal.vue'
import { toPng, toBlob, getFontEmbedCSS } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { saveExport as saveAs } from '../utils/saveExport'
import { useNotificationStore } from '../stores/notificationStore'
import ConfirmDialog from './UI/ConfirmDialog.vue'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { lyricsExportOptions } from '../utils/dialogChoices'
import { prepareScoreExport } from '../utils/scoreLayout'
import appLogoUrl from '../asset/gse_logo_256x256.png'

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
const integrityIssue = computed(() => store.integrityIssues.find(issue => issue.collectionId === props.collection.id))

const { confirmState, askConfirm } = useConfirmDialog()

const duplicate = () => {
  store.duplicateCollection(props.collection.id)
}

const confirmDelete = async () => {
  const confirmed = await askConfirm({
    title: 'Eliminar colección',
    message: `Se eliminará la colección «${props.collection.name}». Sus canciones seguirán en la biblioteca.`,
    isDanger: true,
    confirmText: 'Eliminar colección'
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

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})

const truncatePdfText = (pdf, text, maxWidth) => {
  if (pdf.getTextWidth(text) <= maxWidth) return text
  let truncated = text
  while (truncated.length && pdf.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}

const prepareExport = () => {
  try {
    return store.exportCollection(props.collection.id)
  } catch (error) {
    notification.addToast(error.message, error.code === 'MISSING_COLLECTION_SONGS' ? 'warning' : 'error', 6000)
    return null
  }
}

const exportCollectionPDF = async () => {
  const exportTrigger = document.activeElement
  const data = prepareExport()
  if (!data) return
  if (data.collection.songs.length === 0) {
    notification.addToast('La colección está vacía', 'warning')
    return
  }

  isExporting.value = true
  await nextTick()

  try {
    const songsRegistry = { songs: Object.fromEntries(data.songs.map(song => [song.id, song])) }
    
    // Recopilar metadatos de todas las canciones primero
    const coverList = []
    for (const songId of data.collection.songs) {
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
    const logo = await loadImage(appLogoUrl)
    
    // --- PORTADA ---
    let yPos = 32
    
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(20)
    pdf.text(props.collection.name, pdfWidth / 2, yPos, { align: "center" })
    yPos += 12

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    const dateStr = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
    pdf.text(`Exportado el ${dateStr}`, pdfWidth / 2, yPos, { align: "center" })
    yPos += 8
    
    pdf.setFontSize(10)
    pdf.text(`${data.collection.songs.length} canciones`, pdfWidth / 2, yPos, { align: "center" })
    yPos += 14

    // LISTA DE CANCIONES (TOC)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")

    const columnWidth = 82
    const leftX = 18
    const rightX = pdfWidth / 2 + 5
    const rowsPerColumn = Math.ceil(coverList.length / 2)
    const rowHeight = 6.25

    coverList.forEach((item, index) => {
      const column = Math.floor(index / rowsPerColumn)
      const row = index % rowsPerColumn
      const x = column === 0 ? leftX : rightX
      const indexedItem = `${index + 1}. ${item}`
      pdf.text(truncatePdfText(pdf, indexedItem, columnWidth), x, yPos + row * rowHeight)
    })

    const footerY = pdfHeight - 18
    pdf.setDrawColor(153)
    pdf.line(18, footerY - 5, pdfWidth - 18, footerY - 5)
    pdf.addImage(logo, 'PNG', pdfWidth / 2 - 17, footerY - 2, 5, 5)
    pdf.setFontSize(8)
    pdf.setTextColor(68)
    pdf.text('Group Sheet Editor', pdfWidth / 2 - 10, footerY + 2)
    pdf.setTextColor(0)
    
    pdf.addPage()
    // --- FIN PORTADA ---
    
    // --- FIN PORTADA ---
    
    // --- FIN PORTADA ---
    
    console.log('Iniciando exportación de colección:', props.collection.name)
    
    // Preguntar por letras una sola vez al inicio
    const includeLyrics = await askConfirm(lyricsExportOptions)
    if (includeLyrics === null) return

    for (let i = 0; i < data.collection.songs.length; i++) {
      const songId = data.collection.songs[i]
      console.log(`Procesando canción ${i + 1}/${data.collection.songs.length} (ID: ${songId})`)
      
      const songData = songsRegistry.songs[songId]
      if (!songData) {
        console.warn('Canción no encontrada en el registro:', songId)
        continue
      }

      // Cargar canción en el store
      await sheetStore.loadSong(songId)
      console.log('Canción cargada:', sheetStore.header.center.top.name)
      
      // Preparar datos del footer
      const nextSongId = i + 1 < data.collection.songs.length ? data.collection.songs[i + 1] : null
      const nextSongData = nextSongId ? songsRegistry.songs[nextSongId] : null
      
      const footerData = {
        current: i + 1,
        total: data.collection.songs.length,
        nextTitle: nextSongData ? (nextSongData.header?.center?.top?.name || 'Sin nombre') : null,
        nextAuthor: nextSongData ? (nextSongData.header?.center?.bottom?.author || '') : null
      }
      
      sheetStore.updateExportFooter(footerData)
      
      // Esperar a que Vue actualice el DOM
      await nextTick()
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }
      await new Promise(resolve => setTimeout(resolve, 800)) // Wait for render
      
      const sheetPage = document.getElementById('sheet-page')
      if (sheetPage) {
        
        // Activar clase de exportación temporalmente
        sheetPage.classList.add('pdf-export')
        
        try {
          await prepareScoreExport(sheetPage)
          const fontEmbedCSS = await getFontEmbedCSS(sheetPage)
          const imgData = await toPng(sheetPage, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            fontEmbedCSS
          })
          const imgProps = pdf.getImageProperties(imgData)
          const imgRatio = imgProps.width / imgProps.height
          const printWidth = pdfWidth
          const printHeight = printWidth / imgRatio
          
          if (i > 0) {
            pdf.addPage()
          }
          
          pdf.addImage(imgData, 'PNG', 0, 0, printWidth, printHeight)
          
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
            const lyricsFontCSS = await getFontEmbedCSS(lyricsPage)
            const imgData = await toPng(lyricsPage, {
              quality: 1,
              pixelRatio: 2,
              backgroundColor: '#ffffff',
              fontEmbedCSS: lyricsFontCSS
            })
            const imgProps = pdf.getImageProperties(imgData)
            const imgRatio = imgProps.width / imgProps.height
            const printWidth = pdfWidth
            const printHeight = printWidth / imgRatio
            
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, 0, printWidth, printHeight)
  
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
    await saveAs(pdf.output('blob'), `${fileName}.pdf`)

  } catch (error) {
    console.error('Error exportando colección:', error)
    notification.addToast('Error al generar el PDF: ' + error.message, 'error')
    // Asegurar limpieza en caso de error
    sheetStore.updateExportFooter(null)
  } finally {
    isExporting.value = false
    await nextTick()
    if (exportTrigger?.isConnected) exportTrigger.focus()
  }
}

const exportJSON = async () => {
  const data = prepareExport()
  if (!data) return
  try {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const fileName = getExportFileName()
    await saveAs(blob, `${fileName}.col`)
    notification.addToast('Colección exportada exitosamente', 'success')
  } catch (error) {
    console.error('Error exportando colección:', error)
    notification.addToast('Error al exportar: ' + error.message, 'error')
  }
}

const exportEPUB = async () => {
  const exportTrigger = document.activeElement
  const data = prepareExport()
  if (!data) return
  if (data.collection.songs.length === 0) {
    notification.addToast('La colección está vacía', 'warning')
    return
  }

  isExporting.value = true
  await nextTick()

  try {
    const songsRegistry = { songs: Object.fromEntries(data.songs.map(song => [song.id, song])) }
    const songsToExport = []
    const imageBlobs = []

    // Preguntar por letras una sola vez al inicio
    const includeLyrics = await askConfirm(lyricsExportOptions)
    if (includeLyrics === null) return

    // 1. Collect Metadata and Capture Images sequentially
    for (const songId of data.collection.songs) {
      if (songsRegistry.songs[songId]) {
        // Metadata copy
        const songData = JSON.parse(JSON.stringify(songsRegistry.songs[songId]))
        
        // Capture Image logic (hijack main view)
        await sheetStore.loadSong(songId)
        
        // Wait for render
        await nextTick()
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }
        await new Promise(resolve => setTimeout(resolve, 800))

        const sheetPage = document.getElementById('sheet-page')
        if (sheetPage) {
           sheetPage.classList.add('pdf-export') // Ensure clean look
           try {
             // 1. Capture Sheet
             await prepareScoreExport(sheetPage)
             const fontEmbedCSS = await getFontEmbedCSS(sheetPage)
             const blob = await toBlob(sheetPage, {
               quality: 0.9,
               pixelRatio: 2,
               backgroundColor: '#ffffff',
               fontEmbedCSS,
               type: 'image/jpeg'
             })
             
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
                 const lyricsFontCSS = await getFontEmbedCSS(lyricsPage)
                 const blob = await toBlob(lyricsPage, {
                   quality: 0.9,
                   pixelRatio: 2,
                   backgroundColor: '#ffffff',
                   fontEmbedCSS: lyricsFontCSS,
                   type: 'image/jpeg'
                 })
                 
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
    await saveAs(blob, `${fileName}.epub`)

  } catch (error) {
    console.error('Error exportando EPUB:', error)
    notification.addToast('Error al generar EPUB: ' + error.message, 'error')
  } finally {
    isExporting.value = false
    await nextTick()
    if (exportTrigger?.isConnected) exportTrigger.focus()
  }
}
</script>

<style scoped>
.collection-item { border: 1px solid var(--ms-border); border-radius: var(--ms-radius-md); background: var(--ms-surface); padding: 12px; transition: border-color .15s; }
.collection-item:hover { border-color: var(--ms-accent); }
.collection-card-heading { display: flex; align-items: center; gap: 10px; }
.collection-art { display: grid; place-items: center; width: 36px; height: 42px; flex-shrink: 0; background: var(--ms-accent-soft); color: var(--ms-accent); border-radius: var(--ms-radius-sm); }
.collection-info { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
.collection-name { font-weight: 600; font-size: 12px; color: var(--ms-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.collection-count { font-size: 10px; color: var(--ms-text-muted); }
.collection-integrity-warning { display: flex; align-items: center; gap: 6px; color: var(--ms-warning); background: transparent; border: 0; padding: 10px 0 0; font-size: 11px; text-align: left; }
.collection-integrity-warning .app-icon { font-size: 15px; }
.collection-open { display: flex; border: 0; background: transparent; color: var(--ms-text-muted); padding: 3px; border-radius: var(--ms-radius-sm); }
.collection-open:hover { color: var(--ms-accent); background: var(--ms-surface-hover); }
.collection-actions { display: flex; gap: 3px; padding-top: 10px; margin-top: 10px; border-top: 1px solid var(--ms-border); }
.action-btn { display: grid; place-items: center; flex: 1; background: transparent; border: 0; padding: 6px; border-radius: var(--ms-radius-sm); color: var(--ms-text-muted); min-height: 30px; }
.action-btn:hover { background: var(--ms-surface-hover); color: var(--ms-accent); }
.action-btn.danger:hover { background: var(--ms-danger-soft); color: var(--ms-danger); }
.action-btn .material-icons { font-size: 16px; }
.pdf-export-container { position: absolute; left: -10000px; top: 0; width: 210mm; opacity: 1; background: white; z-index: -1000; }
</style>
