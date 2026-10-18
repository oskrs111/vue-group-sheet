<template>
  <div v-if="isEpubMode" class="epub-preview-container">
    <div class="epub-controls">
      <button @click="generateAndDownloadEpub" :disabled="isGenerating" class="download-btn">
        {{ isGenerating ? "Generando…" : "Descargar EPUB para Kindle" }}
      </button>
    </div>
    <div class="preview-scroll-area">
      <EpubPage v-if="epubData" :sheetData="epubData" />
      <div v-else class="loading-error">No se encontraron datos para la vista previa.</div>
    </div>
  </div>
  <div v-else id="app-layout">
    <WorkspaceHeader :library-open="showLibrary" @library="toolbarRef?.openLibrary()" @toggle-library="showLibrary = !showLibrary" @fit="fitDocument" @integrity="checkCollections" />
    <div id="toolbar" class="toolbar-container">
      <Toolbar ref="toolbarRef" />
    </div>
    <div class="workspace-body">
    <main id="main" class="main-container" aria-label="Editor de la canción">
      <div class="document-toolbar">
        <div class="document-heading">
          <AppIcon name="description" />
          <h1 class="document-title">{{ store.header.center.top.name || 'Nueva canción' }}</h1>
          <span class="document-format">A4 · {{ store.settings.page_orientation === 'V' ? 'Vertical' : 'Horizontal' }}</span>
        </div>
        <div class="zoom-controls" role="group" aria-label="Zoom del documento">
          <button type="button" :disabled="sheetZoom <= 25" @click="changeZoom(-10)" aria-label="Alejar documento" title="Alejar"><AppIcon name="remove" /></button>
          <output aria-live="polite">{{ sheetZoom }}%</output>
          <button type="button" :disabled="sheetZoom >= 150" @click="changeZoom(10)" aria-label="Acercar documento" title="Acercar"><AppIcon name="add" /></button>
          <button type="button" class="fit-button" @click="fitDocument" aria-label="Ajustar documento al espacio disponible" title="Ajustar a la ventana"><AppIcon name="fit" /><span>Ajustar</span></button>
        </div>
      </div>
      <div v-if="hasSelection" class="section-actions-container" aria-label="Acciones de la selección">
        <SectionActions @edit="handleEditSection" />
        <CompassActions @edit-request="handleEditCompassRequest" @delete-request="handleDeleteCompassRequest" />
        <StructureActions @edit-request="handleEditStructureRequest" />
      </div>
      <div id="page-wrapper" class="page-wrapper" ref="pageWrapperRef">
        <div class="paper-stage" :style="{ '--paper-zoom': sheetZoom / 100 }">
        <div
          :class="[pageClass, store.settings.page_orientation === 'V' ? (isSheetOverflowing ? 'out-of-bounds' : 'in-bounds') : '']"
          id="sheet-page"
          ref="sheetPageRef"
          :style="sheetFontStyles"
        >
          <HeaderComponent />
          <BodyComponent ref="bodyComponent" />
          <StructureComponent ref="structureComponent" />
          <NotesComponent v-if="store.settings.show_notes" />

          <!-- Export Footer -->
          <div v-if="store.exportFooterData" class="export-footer">
            <div class="footer-left">{{ store.exportFooterData.current }} / {{ store.exportFooterData.total }}</div>
            <div class="footer-right">
              <span v-if="store.exportFooterData.nextTitle"> SIGUIENTE: {{ store.exportFooterData.nextTitle }} - {{ store.exportFooterData.nextAuthor }} </span>
            </div>
          </div>
        </div>
        <LyricsPage v-if="store.settings.show_lyrics" :class="pageClass" :style="sheetFontStyles" />
        </div>
      </div>
      <footer class="undo-status-footer">
        <span class="save-status" :class="{ draft: !store.currentSongId }">{{ store.currentSongId ? 'Autoguardado activo' : 'Borrador sin guardar' }}</span>
        <span class="undo-description">{{ undoStatusText }}</span>
        <span>{{ isSheetOverflowing ? 'Contenido fuera de página' : `${store.body.length} ${store.body.length === 1 ? 'sección' : 'secciones'} · ${store.structure.filter(item => !item.isBreak).length} ${store.structure.filter(item => !item.isBreak).length === 1 ? 'parte' : 'partes'}` }}</span>
      </footer>
    </main>
    <button v-if="showLibrary" class="library-scrim" type="button" aria-label="Cerrar biblioteca" @click="showLibrary = false"></button>
    <CollectionContainer v-if="showLibrary" :compact="isCompact" @close="showLibrary = false" @open-song="toolbarRef?.openSong($event)" @save-song="toolbarRef?.openSave()" />
    </div>
    <ToastProvider />
    <Teleport to="#modal-container">
      <CollectionIntegrityModal v-if="collectionStore.integrityReportOpen" @close="collectionStore.integrityReportOpen = false" @recheck="checkCollections" />
    </Teleport>
  </div>
</template>

<style>
#sheet-page {
  transition: outline 0.3s ease;
}

/* EPUB Preview Styles */
.epub-preview-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--ms-bg);
}

.epub-controls {
  padding: 15px;
  background: var(--ms-surface);
  border-bottom: 1px solid var(--ms-border);
  color: var(--ms-text);
  display: flex;
  justify-content: center;
  z-index: 100;
}

.download-btn {
  background: var(--ms-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: var(--ms-radius-sm);
  cursor: pointer;
  font-weight: bold;
}

.download-btn:disabled {
  background: var(--ms-text-muted);
  cursor: not-allowed;
}

.preview-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
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



/* PDF Export - A4 */
#sheet-page.pdf-export {
  min-height: unset !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  background: white !important;
  position: relative !important;
  box-shadow: none !important;
  outline: 0 !important;
  outline-width: 0 !important;
  overflow: hidden !important;
}

</style>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, provide } from "vue";
import { useSheetStore } from "./stores/sheetStore";
import { useCollectionStore } from "./stores/collectionStore";
import { useNotificationStore } from "./stores/notificationStore";
import CollectionIntegrityModal from "./components/CollectionIntegrityModal.vue";
import Toolbar from "./components/Toolbar.vue";
import WorkspaceHeader from "./components/WorkspaceHeader.vue";
import HeaderComponent from "./components/$Header.vue";
import BodyComponent from "./components/@Body.vue";
import StructureComponent from "./components/$Structure.vue";
import NotesComponent from "./components/$Notes.vue";
import SectionActions from "./components/SectionActions.vue";
import CompassActions from "./components/CompassActions.vue";
import StructureActions from "./components/StructureActions.vue";
import CollectionContainer from "./components/CollectionContainer.vue";
import EpubPage from "./components/EpubPage.vue";
import LyricsPage from "./components/LyricsPage.vue";
import { toBlob, getFontEmbedCSS } from "html-to-image";
import { saveExport as saveAs } from "./utils/saveExport";
import { prepareScoreExport } from "./utils/scoreLayout";
import { CHORD_FONT_KEY, getSheetFont, getSheetFontStyles } from "./utils/sheetFonts";
import ToastProvider from "./components/UI/ToastProvider.vue";

const store = useSheetStore();
const collectionStore = useCollectionStore();
const checkCollections = async () => {
  collectionStore.integrityReportOpen = true;
  try {
    await collectionStore.recheckIntegrity();
  } catch (error) {
    useNotificationStore().addToast('No se pudo comprobar la biblioteca: ' + error.message, 'error');
  }
};
watch(() => JSON.stringify(collectionStore.integrityIssues), () => {
  if (collectionStore.integrityIssues.length) collectionStore.integrityReportOpen = true;
});
const toolbarRef = ref(null);
const pageWrapperRef = ref(null);
const showLibrary = ref(window.innerWidth > 1100);
const isCompact = ref(window.innerWidth <= 1100);
const sheetZoom = ref(100);
const autoFit = ref(true);
const hasSelection = computed(() => store.selectedSectionId !== null || store.selectedCompass !== null || store.selectedStructureIndex !== null);
let viewportObserver;
const fitDocument = () => {
  autoFit.value = true;
  const paperWidth = store.settings.page_orientation === 'V' ? 794 : 1123;
  sheetZoom.value = Math.max(25, Math.min(100, Math.floor(((pageWrapperRef.value?.clientWidth || window.innerWidth) - 64) / paperWidth * 100)));
};
const changeZoom = delta => {
  autoFit.value = false;
  sheetZoom.value = Math.max(25, Math.min(150, sheetZoom.value + delta));
};
watch(() => store.settings.page_orientation, () => { if (autoFit.value) nextTick(fitDocument); });
const bodyComponent = ref(null);
const structureComponent = ref(null);
const sheetPageRef = ref(null);
const isEpubMode = ref(false);
const epubData = ref(null);
const isGenerating = ref(false);
const isSheetOverflowing = ref(false);

let resizeObserver = null;

const pageClass = computed(() => {
  return store.settings.page_orientation === "V" ? "page-vertical" : "page-horizontal";
});

const sheetFontStyles = computed(() => getSheetFontStyles(store.settings));
provide(CHORD_FONT_KEY, computed(() => getSheetFont(store.settings)));

const undoStatusText = computed(() => {
  const levelCount = store.undoHistory.length;
  const lastEntry = store.undoHistory[levelCount - 1];

  if (!lastEntry) {
    return "Deshacer: 0 niveles";
  }

  const formattedTimestamp = new Date(lastEntry.timestamp).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `Deshacer: ${levelCount} ${levelCount === 1 ? "nivel" : "niveles"}. ${formattedTimestamp} - ${lastEntry.operation}`;
});

const handleEditSection = (section) => {
  if (bodyComponent.value) {
    bodyComponent.value.editSection(section);
  }
};

const handleEditStructureRequest = (index) => {
  if (structureComponent.value) {
    structureComponent.value.triggerEditItem(index);
  }
};

const handleEditCompassRequest = () => {
  const selectedCompass = store.selectedCompass;
  if (selectedCompass && bodyComponent.value) {
    bodyComponent.value.editCompass(selectedCompass.sIndex, selectedCompass.cIndex);
  }
};

const handleDeleteCompassRequest = () => {
  const selectedCompass = store.selectedCompass;
  if (selectedCompass && bodyComponent.value) {
    bodyComponent.value.deleteCompass(selectedCompass.sIndex, selectedCompass.cIndex);
  }
};

const generateAndDownloadEpub = async () => {
  if (!epubData.value) return;

  isGenerating.value = true;

  try {
    // 1. Capture the element
    const element = document.querySelector(".epub-sheet-page");
    if (!element) throw new Error("Preview element not found");

    // Wait slightly for fonts/rendering
    await nextTick();
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await prepareScoreExport(element);

    // Pre-embeber fuentes para captura fiel
    const fontEmbedCSS = await getFontEmbedCSS(element);

    // 2. Capture Logic with visual toggling

    // Elements to toggle
    const lyricsSection = document.querySelector(".epub-lyrics");
    const mainContent = document.querySelectorAll(".epub-header, .epub-body, .epub-structure, .epub-notes");

    let mainBlob = null;
    let lyricsBlob = null;

    // A. Capture Main Sheet (Lyrics hidden)
    if (lyricsSection) lyricsSection.style.display = "none";

    mainBlob = await toBlob(element, {
      quality: 0.9,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      fontEmbedCSS,
      type: "image/jpeg",
    });

    const imageBlobs = [mainBlob];

    // B. Capture Lyrics (Main hidden)
    if (lyricsSection) {
      // Restore lyrics, hide main
      lyricsSection.style.display = "block"; // or ''
      mainContent.forEach((el) => (el.style.display = "none"));

      try {
        // Wait a tick for layout update
        await nextTick();

        lyricsBlob = await toBlob(element, {
          quality: 0.9,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          fontEmbedCSS,
          type: "image/jpeg",
        });
        imageBlobs.push(lyricsBlob);
      } catch (e) {
        console.error("Error capturing epub lyrics", e);
      } finally {
        // Restore State
        mainContent.forEach((el) => (el.style.display = ""));
        lyricsSection.style.display = "";
      }
    } else {
      // Just restore lyrics display if it was hidden (though it failed check?)
      // if it existed but we are here, we should restore just in case
      if (lyricsSection) lyricsSection.style.display = "";
    }

    // 3. Generate EPUB
    const songs = [epubData.value];
    const { EpubGenerator } = await import("./utils/EpubGenerator");
    const generator = new EpubGenerator(epubData.value.header.center.top.name, songs);

    // Use the new image-based method
    const epubBlob = await generator.generateFromImages(imageBlobs);

    // 4. Download
    await saveAs(epubBlob, `${epubData.value.header.center.top.name || "sheet"}.epub`);
  } catch (error) {
    console.error("Error generating EPUB:", error);
    useNotificationStore().addToast("No se pudo generar el EPUB: " + error.message, 'error');
  } finally {
    isGenerating.value = false;
    // Safety restore in case of error mid-flow
    const lyricsSection = document.querySelector(".epub-lyrics");
    const mainContent = document.querySelectorAll(".epub-header, .epub-body, .epub-structure, .epub-notes");
    if (lyricsSection) lyricsSection.style.display = "";
    if (mainContent) mainContent.forEach((el) => (el.style.display = ""));
  }
};

onMounted(() => {
  // Check for EPUB preview mode via hash
  if (window.location.hash === "#epub") {
    isEpubMode.value = true;
    try {
      const storedData = localStorage.getItem("epub_preview_data");
      if (storedData) {
        epubData.value = JSON.parse(storedData);
        // Set document title
        document.title = `EPUB Preview - ${epubData.value.header.center.top.name || "Untitled"}`;
      }
    } catch (e) {
      console.error("Error loading EPUB data", e);
    }
  } else {
    store.initializeApp();

    viewportObserver = new ResizeObserver(() => { isCompact.value = window.innerWidth <= 1100; if (autoFit.value) fitDocument(); });
    if (pageWrapperRef.value) viewportObserver.observe(pageWrapperRef.value);

    // Configurar ResizeObserver para vigilar altura del A4
    if (sheetPageRef.value) {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          // Evaluamos si el render actual superó el equivalente a ~297mm reales en píxeles.
          // getBoundingClientRect().height da el tamaño real pos-transform/zoom.
          isSheetOverflowing.value = entry.target.scrollHeight > entry.target.clientHeight + 2;
        }
      });
      resizeObserver.observe(sheetPageRef.value);
    }
  }
});
onUnmounted(() => { resizeObserver?.disconnect(); viewportObserver?.disconnect(); });
</script>
