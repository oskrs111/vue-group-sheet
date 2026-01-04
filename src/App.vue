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
    <div id="toolbar" class="toolbar-container">
      <Toolbar />
    </div>
    <div id="main" class="main-container">
      <div class="section-actions-container">
        <SectionActions @edit="handleEditSection" />
      </div>
      <div id="page-wrapper" class="page-wrapper">
        <div :class="pageClass" id="sheet-page" :style="{ '--sheet-font-family': fontFamily }">
          <HeaderComponent />
          <BodyComponent ref="bodyComponent" />
          <StructureComponent />
          <NotesComponent v-if="store.settings.show_notes" />
        </div>
      </div>
    </div>
    <CollectionContainer />
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

#sheet-page {
  font-family: var(--sheet-font-family);
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
import CollectionContainer from './components/CollectionContainer.vue'
import EpubPage from './components/EpubPage.vue'
import html2canvas from 'html2canvas'
import { EpubGenerator } from './utils/EpubGenerator'
import { saveAs } from 'file-saver'

const store = useSheetStore()
const bodyComponent = ref(null)
const isEpubMode = ref(false)
const epubData = ref(null)
const isGenerating = ref(false)

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

    // 2. Convert to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    
    // 3. Generate EPUB
    // Wrap single song in array as generator expects
    const songs = [epubData.value] 
    const generator = new EpubGenerator(epubData.value.header.center.top.name, songs)
    
    // Use the new image-based method
    const epubBlob = await generator.generateFromImages([blob])
    
    // 4. Download
    saveAs(epubBlob, `${epubData.value.header.center.top.name || 'sheet'}.epub`)
    
  } catch (error) {
    console.error('Error generating EPUB:', error)
    alert('Error generating EPUB: ' + error.message)
  } finally {
    isGenerating.value = false
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
    store.initializeApp()
  }
})
</script>
