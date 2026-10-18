<template>
  <aside v-dialog="compact ? () => emit('close') : false" class="collections-panel" id="library-panel" aria-labelledby="library-heading">
    <div class="library-heading">
      <div><h2 id="library-heading">Mi biblioteca</h2><p>Canciones y colecciones</p></div>
      <button type="button" class="icon-btn" @click="emit('close')" aria-label="Ocultar biblioteca" title="Ocultar biblioteca"><AppIcon name="close" /></button>
    </div>
    <div class="library-tabs" role="tablist" aria-label="Contenido de la biblioteca">
      <button id="collections-tab" type="button" role="tab" :aria-selected="activeTab === 'collections'" :tabindex="activeTab === 'collections' ? 0 : -1" aria-controls="collections-content" @keydown="moveLibraryTab" @click="activeTab = 'collections'">Colecciones <span class="count-badge">{{ collections.length }}</span></button>
      <button id="songs-tab" type="button" role="tab" :aria-selected="activeTab === 'songs'" :tabindex="activeTab === 'songs' ? 0 : -1" aria-controls="songs-content" @keydown="moveLibraryTab" @click="activeTab = 'songs'">Canciones <span class="count-badge">{{ savedSongs.length }}</span></button>
    </div>
    <div v-if="activeTab === 'collections'" id="collections-content" class="collections-content" role="tabpanel" aria-labelledby="collections-tab">
      <div class="collections-header">
        <input v-model="collectionQuery" class="library-filter" type="search" aria-label="Buscar colecciones" placeholder="Buscar colección…" :disabled="!collections.length" />
        <div class="header-actions">
          <button @click="triggerImport" class="icon-btn" title="Importar Colección">
            <AppIcon name="file_download" />
          </button>
          <button class="add-collection-btn" @click="showCreateDialog = true" title="Nueva colección" aria-label="Nueva colección">
            <AppIcon name="add" />
          </button>
        </div>
        <input type="file" ref="fileInput" accept=".col,.json" style="display: none" @change="handleFileImport" />
      </div>

      <div class="collections-list">
        <div v-if="collections.length === 0" class="empty-state">
          <AppIcon name="book" /><h4>Aún no hay colecciones</h4>
          <p>Agrupa tus canciones y prepara el repertorio de tu próximo ensayo.</p>
          <button type="button" @click="showCreateDialog = true">Crear una colección</button>
        </div>
        <div v-else-if="filteredCollections.length === 0" class="empty-state">
          <AppIcon name="search" /><h4>Sin coincidencias</h4><p>Prueba con otro nombre de colección.</p>
          <button type="button" @click="collectionQuery = ''">Limpiar búsqueda</button>
        </div>
        <CollectionItem 
          v-for="collection in filteredCollections"
          :key="collection.id" 
          :collection="collection" 
        />
      </div>
    </div>
    <div v-else id="songs-content" class="collections-content" role="tabpanel" aria-labelledby="songs-tab">
      <div class="collections-header">
        <input v-model="songQuery" class="library-filter" type="search" aria-label="Buscar canciones por título o autor" placeholder="Buscar canción o autor…" :disabled="!savedSongs.length" />
      </div>
      <div v-if="!savedSongs.length" class="empty-state">
        <AppIcon name="music_note" /><h4>Tu primera canción</h4><p>Guarda la canción del editor para encontrarla aquí y añadirla a tus colecciones.</p>
        <button type="button" @click="emit('save-song')">Guardar canción</button>
      </div>
      <div v-else-if="!filteredSongs.length" class="empty-state">
        <AppIcon name="search" /><h4>Sin coincidencias</h4><p>Prueba con otro título o autor.</p>
        <button type="button" @click="songQuery = ''">Limpiar búsqueda</button>
      </div>
      <div v-else class="library-song-list">
        <p class="library-result-count">{{ filteredSongs.length }} {{ filteredSongs.length === 1 ? 'canción guardada' : 'canciones guardadas' }}</p>
        <button v-for="song in filteredSongs" :key="song.id" type="button" class="library-song" @click="emit('open-song', song.id)">
          <span class="library-song-art"><AppIcon name="description" /></span>
          <span class="library-song-info"><strong>{{ song.name }}</strong><small>{{ song.header?.center?.bottom?.author || 'Sin autor' }}</small></span>
          <AppIcon name="chevron_right" />
        </button>
      </div>
    </div>
    <footer class="library-footer"><AppIcon name="storage" /><span>{{ isDesktop ? 'Archivos en tu carpeta de trabajo' : 'Biblioteca de este navegador' }}</span></footer>

    <!-- Modal Crear Colección -->
    <Teleport to="#modal-container">
      <div v-dialog v-if="showCreateDialog" class="modal-overlay" @click.self="showCreateDialog = false">
        <!-- ... modal content ... -->
        <div class="modal-content">
          <div class="modal-header">Nueva Colección</div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nombre de la Colección:</label>
              <input 
                v-model="newCollectionName" 
                type="text" 
                placeholder="Ej: Repertorio Verano"
                @keyup.enter="createCollection"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showCreateDialog = false">Cancelar</button>
            <button class="primary" @click="createCollection">Crear colección</button>
          </div>
        </div>
      </div>
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
  </aside>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'
import { useNotificationStore } from '../stores/notificationStore'
import CollectionItem from './CollectionItem.vue'
import ConfirmDialog from './UI/ConfirmDialog.vue'
import { useConfirmDialog } from '../composables/useConfirmDialog'

const store = useCollectionStore()
const sheetStore = useSheetStore()
const notification = useNotificationStore()
const emit = defineEmits(['close', 'open-song', 'save-song'])
defineProps({ compact: Boolean })
const activeTab = ref('collections')
const collectionQuery = ref('')
const songQuery = ref('')
const isDesktop = Boolean(window.electronAPI?.storage)
const moveLibraryTab = event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  activeTab.value = event.key === 'Home' ? 'collections' : event.key === 'End' ? 'songs' : activeTab.value === 'collections' ? 'songs' : 'collections'
  nextTick(() => document.getElementById(`${activeTab.value}-tab`)?.focus())
}
const showCreateDialog = ref(false)
const newCollectionName = ref('')
const fileInput = ref(null)

const { confirmState, askConfirm } = useConfirmDialog()

const collections = computed(() => store.collections)
const savedSongs = computed(() => sheetStore.getSongsList())
const filteredCollections = computed(() => collections.value.filter(collection => collection.name.toLocaleLowerCase().includes(collectionQuery.value.trim().toLocaleLowerCase())))
const filteredSongs = computed(() => {
  const query = songQuery.value.trim().toLocaleLowerCase()
  return savedSongs.value.filter(song =>
    (song.name || '').toLocaleLowerCase().includes(query) ||
    (song.header?.center?.bottom?.author || '').toLocaleLowerCase().includes(query)
  )
})

const createCollection = () => {
  if (newCollectionName.value.trim()) {
    store.addCollection(newCollectionName.value.trim())
    newCollectionName.value = ''
    showCreateDialog.value = false
  }
}

const triggerImport = () => {
  fileInput.value.click()
}

const handleFileImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!data.collection || !data.songs) {
        throw new Error('Formato de archivo inválido')
      }

      // 1. Verificar si la colección ya existe
      let finalCollectionName = data.collection.name
      const existingCollection = store.collections.find(c => c.name === finalCollectionName)

      if (existingCollection) {
        const importCopy = await askConfirm({
            title: 'Importar colección como copia',
            message: `Ya existe una colección llamada «${finalCollectionName}». La importación creará otra colección con un nombre distinto.`,
            confirmText: 'Importar como copia'
        })
        
        if (!importCopy) {
          event.target.value = '' // Limpiar input
          return
        }

        // Generar nombre único con sufijo (1), (2), etc.
        let counter = 1
        while (store.collections.some(c => c.name === `${finalCollectionName} (${counter})`)) {
          counter++
        }
        finalCollectionName = `${finalCollectionName} (${counter})`
      }

      // 2. Importar canciones (con resolución de conflictos)
      const songsRegistry = sheetStore.getSongsRegistry()
      let importedSongsCount = 0
      let updatedSongsCount = 0

      for (const song of data.songs) {
        const existingSong = songsRegistry.songs[song.id]
        
        if (!existingSong) {
          // Canción nueva, añadir directamente
          songsRegistry.songs[song.id] = song
          importedSongsCount++
        } else {
          // Conflicto: la canción ya existe
          // Comprobar fechas (asumiendo formato ISO string)
          const existingDate = new Date(existingSong.updatedAt || 0)
          const importedDate = new Date(song.updatedAt || 0)

          if (importedDate > existingDate) {
            // La importada es más reciente, preguntar al usuario
            const overwrite = await askConfirm({
                title: 'Elegir versión de la canción',
                message: `Ya existe «${song.name}». La versión importada es más reciente.\n\nVersión actual: ${existingSong.updatedAt}\nVersión importada: ${song.updatedAt}`,
                confirmText: 'Usar versión importada',
                alternativeText: 'Conservar versión actual',
                isDanger: true
            })
            if (overwrite === null) return
            if (overwrite) {
              songsRegistry.songs[song.id] = song
              updatedSongsCount++
            }
          } else if (existingSong.updatedAt !== song.updatedAt) {
             // Fechas distintas pero no necesariamente más reciente (o sin fecha), preguntar igual por si acaso
             const overwrite = await askConfirm({
                 title: 'Elegir versión de la canción',
                 message: `Ya existe «${song.name}» con una fecha diferente. Elige qué versión quieres conservar.`,
                 confirmText: 'Usar versión importada',
                 alternativeText: 'Conservar versión actual',
                 isDanger: true
             })
             if (overwrite === null) return
             if (overwrite) {
              songsRegistry.songs[song.id] = song
              updatedSongsCount++
            }
          }
          // Si son idénticas o el usuario dice no, no hacemos nada
        }
      }

      // Guardar cambios en canciones
      sheetStore.saveSongsRegistry(songsRegistry)

      // 3. Importar colección
      // Generamos un ID nuevo para evitar colisiones de colecciones, pero usamos el nombre (posiblemente modificado)
      const newCollectionId = store.addCollection(finalCollectionName)
      
      // Actualizar la lista de canciones de la nueva colección
      // (Usamos los IDs originales ya que las canciones se han importado con esos IDs)
      const newCollection = store.collections.find(c => c.id === newCollectionId)
      if (newCollection) {
        newCollection.songs = data.collection.songs
        store.saveCollections()
      }

      notification.addToast(
        `Colección «${finalCollectionName}» importada: ${importedSongsCount} canciones nuevas y ${updatedSongsCount} actualizadas.`,
        'success',
        5000
      )

    } catch (error) {
      console.error('Error importando:', error)
      notification.addToast('Error al importar el archivo: ' + error.message, 'error')
    } finally {
      // Limpiar input para permitir importar el mismo archivo de nuevo
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

onMounted(() => {
  store.loadCollections()
})
</script>

<style scoped>
.collections-panel { flex-shrink: 0; width: var(--ms-sidebar-w); height: 100%; background: var(--ms-surface); border-left: 1px solid var(--ms-border); display: flex; flex-direction: column; z-index: 30; min-height: 0; }
.library-heading { display: flex; align-items: center; justify-content: space-between; padding: 22px 20px 20px; }
.library-heading h2 { font-size: 16px; font-weight: 700; color: var(--ms-text); margin-bottom: 5px; }
.library-heading p { color: var(--ms-text-muted); font-size: 11px; }
.icon-btn { background: transparent; border: 0; cursor: pointer; color: var(--ms-text-muted); width: 30px; height: 32px; border-radius: var(--ms-radius-sm); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-btn:hover { background: var(--ms-surface-hover); color: var(--ms-accent); }
.library-tabs { display: flex; gap: 20px; padding: 0 20px; border-bottom: 1px solid var(--ms-border); }
.library-tabs button { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 0; border: 0; border-bottom: 2px solid transparent; background: transparent; font-size: 12px; color: var(--ms-text-muted); }
.library-tabs button[aria-selected="true"] { color: var(--ms-accent); border-bottom-color: var(--ms-accent); font-weight: 600; }
.collections-content { padding: 20px; overflow-y: auto; flex: 1; min-height: 0; }
.collections-header { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.header-actions { display: flex; align-items: center; gap: 3px; }
.library-filter { width: 100%; min-width: 0; height: 34px; border: 1px solid var(--ms-border); border-radius: var(--ms-radius-sm); background: var(--ms-bg); padding: 0 10px; color: var(--ms-text); font-size: 11px; }
.library-filter:disabled { background: var(--ms-bg); opacity: .65; }
.add-collection-btn { width: 30px; height: 32px; display: inline-flex; align-items: center; justify-content: center; background: var(--ms-accent); color: white; border: 0; border-radius: var(--ms-radius-sm); }
.add-collection-btn:hover { background: var(--ms-accent-hover); }
.collections-list, .library-song-list { display: flex; flex-direction: column; gap: 12px; }
.library-result-count { color: var(--ms-text-muted); font-size: 11px; margin-bottom: 2px; }
.library-song { display: flex; gap: 10px; align-items: center; width: 100%; border: 1px solid var(--ms-border); border-radius: var(--ms-radius-sm); background: var(--ms-surface); padding: 10px; text-align: left; }
.library-song:hover { background: var(--ms-surface-hover); border-color: var(--ms-accent); }
.library-song-art { width: 32px; height: 40px; display: grid; place-items: center; flex-shrink: 0; border: 1px solid var(--ms-border); border-radius: 3px; background: var(--ms-surface); color: var(--ms-accent); }
.library-song-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.library-song-info strong { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ms-text); }
.library-song-info small { font-size: 10px; color: var(--ms-text-muted); }
.library-song > .app-icon { font-size: 14px; color: var(--ms-text-muted); }
.library-footer { flex-shrink: 0; padding: 14px 20px; display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--ms-border); color: var(--ms-text-muted); font-size: 10px; }
.library-footer .app-icon { font-size: 14px; }
</style>
