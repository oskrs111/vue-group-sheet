<template>
  <div v-if="isEpubMode" class="epub-preview-container">
    <div class="epub-controls">
      <button @click="generateAndDownloadEpub" :disabled="isGenerating" class="download-btn">
        {{ isGenerating ? 'Generando...' : 'Descargar EPUB (Kindle Optimized)' }}
      </button>
    </div>
    <div class="preview-scroll-area">
      <EpubPage v-if="epubData" :sheetData="epubData" />
      <div v-else class="loading-error">
        No se encontraron datos para la vista previa.
      </div>
    </div>
  </div>
  <div v-else id="app-layout">

    <!-- Splash Screen -->
    <Teleport to="body">
      <Transition name="splash-fade">
        <div v-if="showSplash" class="splash-overlay">
          <!-- Neon background blobs -->
          <div class="splash-blob splash-blob-1"></div>
          <div class="splash-blob splash-blob-2"></div>
          <div class="splash-blob splash-blob-3"></div>

          <div class="splash-card">
            <div class="splash-title-row">
              <h1 class="splash-title">Group Sheet Editor</h1>
              <div class="splash-meta">
                <span class="splash-badge">Alpha Release</span>
                <span class="splash-version">v0.0.1 Build 26</span>
              </div>
            </div>
            <p class="splash-author">by Oscar Sanz</p>
            <a class="splash-link" href="https://github.com/oskrs111" target="_blank" rel="noopener">github.com/oskrs111</a>
            <div class="splash-progress-track">
              <div class="splash-progress-bar"></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <div id="toolbar" class="toolbar-container">
      <Toolbar />
    </div>
    <div id="main" class="main-container">
      <div class="section-actions-container">
        <SectionActions @edit="handleEditSection" />
        <StructureActions @edit-request="handleEditStructureRequest" />
      </div>
      <div id="page-wrapper" class="page-wrapper">
        <div 
          :class="[
            pageClass, 
            store.settings.page_orientation === 'V' ? (isSheetOverflowing ? 'out-of-bounds' : 'in-bounds') : ''
          ]" 
          id="sheet-page" 
          ref="sheetPageRef"
          :style="{ '--sheet-font-family': fontFamily }"
        >
          <HeaderComponent />
          <BodyComponent ref="bodyComponent" />
          <StructureComponent ref="structureComponent" />
          <NotesComponent v-if="store.settings.show_notes" />
          
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
        </div>
        <LyricsPage 
          v-if="store.settings.show_lyrics" 
          :class="pageClass" 
          :style="{ '--sheet-font-family': fontFamily }"
        />
      </div>
    </div>
    <CollectionContainer />
    <ToastProvider />
  </div>
</template>

<style>
:root {
  --sheet-font-family: 'Libre Baskerville', serif;
}

#app-layout {
  display: flex;
  width: 100%;
}

/* Indicadores de sobrepaso visual A4 (solo visible en interfaz web) */
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

#sheet-page {
  font-family: var(--sheet-font-family);
  transition: outline 0.3s ease;
}

/* EPUB Preview Styles */
.epub-preview-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f0f0;
}

.epub-controls {
  padding: 15px;
  background: #333;
  color: white;
  display: flex;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 100;
}

.download-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1.1em;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.download-btn:disabled {
  background: #666;
  cursor: not-allowed;
}

.preview-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.section-actions-container {
 display: flex;
 flex-wrap: wrap; /* Allow wrapping if needed */
 width: 100%;
 position: sticky;
 top: 0;
 z-index: 90;
 background-color: #f5f5f5; /* Match toolbar bg */
}
/* Export Footer Styles */
.export-footer {
  margin-top: auto; /* Push to bottom of flex container */
  padding-top: 10px;
  border-top: 2px solid #333;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  font-family: var(--sheet-font-family);
}

.footer-left {
  font-weight: bold;
}

.footer-right {
  font-style: italic;
  text-align: right;
}

/* PDF Export A4 Enrures */
#sheet-page.pdf-export {
  width: 210mm !important;
  min-height: auto !important; /* Permitir que el contenido dicte la altura, evitando páginas extra */
  padding: 15mm !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  background: white !important;
  position: relative !important;
  box-shadow: none !important;
  outline: 0 !important;
  outline-width: 0 !important;
  overflow: hidden !important; /* Cortar cualquier micro-desbordamiento que genere páginas en blanco */
}

/* ===================== */
/* === SPLASH SCREEN === */
/* ===================== */
.splash-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-base);
  overflow: hidden;
}

/* Neon ambient blobs */
.splash-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.35;
  animation: blobPulse 6s ease-in-out infinite alternate;
  pointer-events: none;
}
.splash-blob-1 {
  width: 380px; height: 380px;
  background: #3b82f6;
  top: -80px; left: -80px;
  animation-delay: 0s;
}
.splash-blob-2 {
  width: 300px; height: 300px;
  background: #6366f1;
  bottom: -60px; right: -60px;
  animation-delay: -2s;
}
.splash-blob-3 {
  width: 200px; height: 200px;
  background: #38bdf8;
  top: 50%; left: 55%;
  animation-delay: -4s;
}

@keyframes blobPulse {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.15) translate(20px, -20px); }
}

.splash-card {
  position: relative;
  background: rgba(24, 24, 27, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  box-shadow:
    0 0 40px rgba(59, 130, 246, 0.2),
    0 25px 50px rgba(0, 0, 0, 0.6);
  min-width: 440px;
  animation: splashCardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes splashCardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.splash-title-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.splash-title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--ui-text-primary);
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  letter-spacing: -0.5px;
  text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
}

.splash-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.splash-badge {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: var(--ui-accent-hover);
  border-radius: 9999px;
  padding: 3px 10px;
  white-space: nowrap;
  width: fit-content;
}

.splash-version {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ui-text-secondary);
  opacity: 0.8;
  font-family: 'Geist', monospace;
}

.splash-author {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ui-text-secondary);
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
}

.splash-link {
  font-size: 0.8rem;
  color: var(--ui-accent);
  text-decoration: none;
  transition: color 0.2s;
  font-family: 'Geist', monospace, sans-serif;
}
.splash-link:hover { color: var(--ui-accent-hover); text-decoration: underline; }

.splash-progress-track {
  margin-top: 20px;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.splash-progress-bar {
  height: 100%;
  width: 0%;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--ui-accent), #38bdf8);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
  animation: splashProgress 5s linear forwards;
}

@keyframes splashProgress {
  from { width: 0%; }
  to   { width: 100%; }
}

/* Fade-out transition */
.splash-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.splash-fade-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSheetStore } from './stores/sheetStore'
import Toolbar from './components/Toolbar.vue'
import HeaderComponent from './components/$Header.vue'
import BodyComponent from './components/@Body.vue'
import StructureComponent from './components/$Structure.vue'
import NotesComponent from './components/$Notes.vue'
import SectionActions from './components/SectionActions.vue'
import StructureActions from './components/StructureActions.vue'
import CollectionContainer from './components/CollectionContainer.vue'
import EpubPage from './components/EpubPage.vue'
import LyricsPage from './components/LyricsPage.vue'
import html2canvas from 'html2canvas'
import { EpubGenerator } from './utils/EpubGenerator'
import { saveAs } from 'file-saver'
import ToastProvider from './components/UI/ToastProvider.vue'

const store = useSheetStore()
const bodyComponent = ref(null)
const structureComponent = ref(null)
const sheetPageRef = ref(null)
const isEpubMode = ref(false)
const epubData = ref(null)
const isGenerating = ref(false)
const showSplash = ref(false)
const isSheetOverflowing = ref(false)

// 297mm (1122.5px) + 20px padding superior + 20px padding inferior = 1162.5px.
// Añadimos una tolerancia de 5px para evitar falsos positivos por redondeo de píxeles: 1167.5px.
const MAX_A4_HEIGHT_PX = 1167.5 
let resizeObserver = null

const pageClass = computed(() => {
  return store.settings.page_orientation === 'V' ? 'page-vertical' : 'page-horizontal'
})

const fontFamily = computed(() => {
  return store.settings.font_family || "Libre Baskerville"
})

const handleEditSection = (section) => {
  if (bodyComponent.value) {
    bodyComponent.value.editSection(section)
  }
}

const handleEditStructureRequest = (index) => {
  if (structureComponent.value) {
    structureComponent.value.triggerEditItem(index)
  }
}

const generateAndDownloadEpub = async () => {
  if (!epubData.value) return
  
  isGenerating.value = true
  
  try {
    // 1. Capture the element
    const element = document.querySelector('.epub-sheet-page')
    if (!element) throw new Error('Preview element not found')

    // Wait slightly for fonts/rendering
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 500))

    const canvas = await html2canvas(element, {
      scale: 2, // Retain good quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // 2. Capture Logic with visual toggling
    
    // Elements to toggle
    const lyricsSection = document.querySelector('.epub-lyrics')
    const mainContent = document.querySelectorAll('.epub-header, .epub-body, .epub-structure, .epub-notes')
    
    let mainBlob = null
    let lyricsBlob = null
    
    // A. Capture Main Sheet (Lyrics hidden)
    if (lyricsSection) lyricsSection.style.display = 'none'
    
    const canvasMain = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    mainBlob = await new Promise(resolve => canvasMain.toBlob(resolve, 'image/jpeg', 0.9))
    
    const imageBlobs = [mainBlob]
    
    // B. Capture Lyrics (Main hidden)
    if (lyricsSection) {
       // Restore lyrics, hide main
       lyricsSection.style.display = 'block' // or ''
       mainContent.forEach(el => el.style.display = 'none')
       
       try {
         // Wait a tick for layout update
         await nextTick()
         
         const canvasLyrics = await html2canvas(element, {
             scale: 2,
             useCORS: true,
             logging: false,
             backgroundColor: '#ffffff'
         })
         lyricsBlob = await new Promise(resolve => canvasLyrics.toBlob(resolve, 'image/jpeg', 0.9))
         imageBlobs.push(lyricsBlob)
         
       } catch (e) {
          console.error('Error capturing epub lyrics', e)
       } finally {
          // Restore State
          mainContent.forEach(el => el.style.display = '')
          lyricsSection.style.display = ''
       }
    } else {
       // Just restore lyrics display if it was hidden (though it failed check?)
       // if it existed but we are here, we should restore just in case
        if (lyricsSection) lyricsSection.style.display = ''
    }

    // 3. Generate EPUB
    const songs = [epubData.value] 
    const generator = new EpubGenerator(epubData.value.header.center.top.name, songs)
    
    // Use the new image-based method
    const epubBlob = await generator.generateFromImages(imageBlobs)
    
    // 4. Download
    saveAs(epubBlob, `${epubData.value.header.center.top.name || 'sheet'}.epub`)
    
  } catch (error) {
    console.error('Error generating EPUB:', error)
    alert('Error generating EPUB: ' + error.message)
  } finally {
    isGenerating.value = false
    // Safety restore in case of error mid-flow
    const lyricsSection = document.querySelector('.epub-lyrics')
    const mainContent = document.querySelectorAll('.epub-header, .epub-body, .epub-structure, .epub-notes')
    if (lyricsSection) lyricsSection.style.display = ''
    if (mainContent) mainContent.forEach(el => el.style.display = '')
  }
}

onMounted(() => {
  // Check for EPUB preview mode via hash
  if (window.location.hash === '#epub') {
    isEpubMode.value = true
    try {
      const storedData = localStorage.getItem('epub_preview_data')
      if (storedData) {
        epubData.value = JSON.parse(storedData)
        // Set document title
        document.title = `EPUB Preview - ${epubData.value.header.center.top.name || 'Untitled'}`
      }
    } catch (e) {
      console.error('Error loading EPUB data', e)
    }
  } else {
    // Mostrar splash screen 5 segundos
    showSplash.value = true
    setTimeout(() => {
      showSplash.value = false
    }, 5000)

    store.initializeApp()
    
    // Configurar ResizeObserver para vigilar altura del A4
    if (sheetPageRef.value) {
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
           // Evaluamos si el render actual superó el equivalente a ~297mm reales en píxeles.
           // getBoundingClientRect().height da el tamaño real pos-transform/zoom.
           const rect = entry.target.getBoundingClientRect()
           isSheetOverflowing.value = rect.height > MAX_A4_HEIGHT_PX
        }
      })
      resizeObserver.observe(sheetPageRef.value)
    }
  }
})
</script>
