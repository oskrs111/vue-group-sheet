<template>
  <div id="app-layout">
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
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSheetStore } from './stores/sheetStore'
import Toolbar from './components/Toolbar.vue'
import HeaderComponent from './components/$Header.vue'
import BodyComponent from './components/@Body.vue'
import StructureComponent from './components/$Structure.vue'
import NotesComponent from './components/$Notes.vue'
import SectionActions from './components/SectionActions.vue'
import CollectionContainer from './components/CollectionContainer.vue'

const store = useSheetStore()
const bodyComponent = ref(null)

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

onMounted(() => {
  store.initializeApp()
})
</script>
