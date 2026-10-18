<template>
  <header class="workspace-header">
    <a class="workspace-brand" href="#" @click.prevent="emit('fit')" aria-label="Group Sheet Editor, ajustar documento">
      <img :src="logo" alt="" width="36" height="36" />
      <span>Group Sheet<span class="brand-caption">Editor de canciones</span></span>
    </a>
    <nav class="workspace-navigation" aria-label="Navegación principal">
      <span class="nav-current" aria-current="page">Editor</span>
      <button type="button" @click="emit('library')">Biblioteca <span class="count-badge">{{ songCount }}</span></button>
    </nav>
    <span class="workspace-edition">{{ isDesktop ? 'Escritorio' : 'Versión web' }}</span>
    <button type="button" class="integrity-toggle" :class="{ incomplete: collectionStore.integrityIssues.length }" aria-label="Comprobar colecciones" :title="collectionStore.integrityIssues.length ? `${collectionStore.integrityIssues.length} ${collectionStore.integrityIssues.length === 1 ? 'colección incompleta' : 'colecciones incompletas'}` : 'Comprobar colecciones'" @click="emit('integrity')">
      <AppIcon :name="collectionStore.integrityIssues.length ? 'warning' : 'check_circle'" /><span>{{ collectionStore.integrityIssues.length || 'Integridad' }}</span>
    </button>
    <button type="button" class="library-toggle" aria-label="Mi biblioteca" :aria-expanded="libraryOpen" aria-controls="library-panel" @click="emit('toggle-library')">
      <AppIcon name="book" /><span>Mi biblioteca</span>
    </button>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import { useCollectionStore } from '../stores/collectionStore'
import AppIcon from './UI/AppIcon.vue'
import logo from '../asset/gse_logo_256x256.png'
defineProps({ libraryOpen: Boolean })
const emit = defineEmits(['library', 'toggle-library', 'fit', 'integrity'])
const store = useSheetStore()
const collectionStore = useCollectionStore()
const isDesktop = Boolean(window.electronAPI?.storage)
const songCount = computed(() => store.getSongsList().length)
</script>
