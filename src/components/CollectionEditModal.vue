<template>
  <div v-dialog class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content collection-edit-modal">
      <div class="modal-header">Editar Colección</div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Nombre de la Colección:</label>
          <input v-model="editName" type="text" @blur="updateName" />
        </div>

        <div class="songs-management">
          <div class="section-title">
            <span>Canciones en la Colección ({{ collectionSongs.length }})</span>
            <button class="add-song-toggle" @click="showAddSong = !showAddSong">
              <AppIcon :name="showAddSong ? 'remove' : 'add'" />
              {{ showAddSong ? 'Cerrar' : 'Añadir Canción' }}
            </button>
          </div>

          <!-- Selector de canciones para añadir -->
          <div v-if="showAddSong" class="add-song-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar canción..."
              aria-label="Buscar canción para añadir a la colección"
              class="song-search-input"
            />
            <div class="add-song-selector">
              <div v-if="availableSongs.length === 0" class="no-songs">
                No hay canciones que coincidan
              </div>
              <div v-for="song in availableSongs" :key="song.id" class="available-song-item">
                <span>{{ song.name }}</span>
                <button @click="addSong(song.id)" class="small-btn">Añadir</button>
              </div>
            </div>
          </div>

          <!-- Lista de canciones actual con reordenación -->
          <div
            ref="songsListRef"
            class="current-songs-list"
            tabindex="0"
            @keydown="onSongListKeydown"
          >
            <div v-if="collectionSongs.length === 0" class="empty-list">
              No hay canciones en esta colección
            </div>
            <div 
              v-for="(song, index) in collectionSongs" 
              :key="song.id" 
              class="collection-song-item"
              :class="{ 
                'is-selected': selectedSongIndex === index,
                'is-dragging': dragIndex === index, 
                'is-drag-over': dragOverIndex === index,
                'drag-up': dragOverIndex === index && dragIndex > index,
                'drag-down': dragOverIndex === index && dragIndex < index
              }"
              draggable="true"
              @click="selectSong(index)"
              @dragstart="onDragStart(index, $event)"
              @dragenter.prevent="onDragEnter(index)"
              @dragover.prevent="onDragOver($event)"
              @drop="onDrop(index)"
              @dragend="onDragEnd"
            >
              <div class="song-drag-handle">
                <AppIcon class="drag-icon" name="drag_indicator" />
              </div>
              <span class="song-position">{{ index + 1 }}</span>
              <span class="song-name" @click="loadSong(song.id)" :title="song.missing ? 'Referencia conservada: importa la canción para recuperar el enlace' : 'Abrir canción'">{{ song.name }}<code v-if="song.missing" class="missing-song-id">{{ song.id }}</code></span>
              <button @click.stop="removeSong(song.id)" class="remove-btn" title="Quitar">
                <AppIcon name="close" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="primary" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
  </div>
  <Teleport to="#modal-container">
    <ConfirmDialog :key="confirmState.id" v-model="confirmState.show" :title="confirmState.title" :message="confirmState.message" :confirmText="confirmState.confirmText" :cancelText="confirmState.cancelText" @confirm="confirmState.onConfirm" @cancel="confirmState.onCancel" />
  </Teleport>
</template>

<script setup>
import { nextTick, ref, computed } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'
import { useNotificationStore } from '../stores/notificationStore'
import ConfirmDialog from './UI/ConfirmDialog.vue'
import { useConfirmDialog } from '../composables/useConfirmDialog'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const store = useCollectionStore()
const sheetStore = useSheetStore()
const notification = useNotificationStore()
const { confirmState, showConfirm } = useConfirmDialog()

const editName = ref(props.collection.name)
const showAddSong = ref(false)
const searchQuery = ref('')
const dragIndex = ref(null)
const dragOverIndex = ref(null)
const selectedSongIndex = ref(null)
const songsListRef = ref(null)

const allSongs = computed(() => sheetStore.getSongsList())

const collectionSongs = computed(() => {
  return props.collection.songs.map(id => {
    return allSongs.value.find(s => s.id === id) || { id, name: 'Canción no encontrada', missing: true }
  })
})

const availableSongs = computed(() => {
  let songs = allSongs.value.filter(song => !props.collection.songs.includes(song.id))
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    songs = songs.filter(song => song.name.toLowerCase().includes(q))
  }
  return songs
})

const updateName = () => {
  if (editName.value.trim() && editName.value !== props.collection.name) {
    store.updateCollection(props.collection.id, { name: editName.value.trim() })
  }
}

const addSong = (songId) => {
  store.addSongToCollection(props.collection.id, songId)
  selectedSongIndex.value = props.collection.songs.length - 1
  focusSongList()
}

const removeSong = (songId) => {
  const removedIndex = props.collection.songs.indexOf(songId)
  store.removeSongFromCollection(props.collection.id, songId)

  if (selectedSongIndex.value === null) return
  if (props.collection.songs.length === 0) {
    selectedSongIndex.value = null
  } else if (selectedSongIndex.value === removedIndex) {
    selectedSongIndex.value = Math.min(removedIndex, props.collection.songs.length - 1)
  } else if (selectedSongIndex.value > removedIndex) {
    selectedSongIndex.value -= 1
  }
}

const selectSong = (index) => {
  selectedSongIndex.value = index
  focusSongList()
}

const focusSongList = () => {
  nextTick(() => songsListRef.value?.focus())
}

const onDragStart = (index, event) => {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

const onDragEnter = (index) => {
  if (dragIndex.value !== null) {
    dragOverIndex.value = index
  }
}

const onDragOver = (event) => {
  if (dragIndex.value !== null) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (index) => {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    store.moveSongInCollection(props.collection.id, dragIndex.value, index)
    selectedSongIndex.value = index
  }
  dragIndex.value = null
  dragOverIndex.value = null
}

const onDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}

const loadSong = (songId) => {
  const song = allSongs.value.find(s => s.id === songId)
  if (!song) return

  const name = song?.name || 'sin nombre'
  showConfirm({
    title: 'Abrir canción',
    message: `Se abrirá «${name}». Los cambios sin guardar del editor se descartarán.`,
    confirmText: 'Abrir canción',
    onConfirm: () => {
      try {
        sheetStore.loadSong(songId)
        emit('close')
      } catch (error) {
        notification.addToast('No se pudo abrir la canción: ' + error.message, 'error')
      }
    }
  })
}

const moveSelectedSong = (offset) => {
  if (selectedSongIndex.value === null) return

  const fromIndex = selectedSongIndex.value
  const maxIndex = props.collection.songs.length - 1
  const toIndex = Math.max(0, Math.min(maxIndex, fromIndex + offset))
  if (toIndex === fromIndex) return

  store.moveSongInCollection(props.collection.id, fromIndex, toIndex)
  selectedSongIndex.value = toIndex
  focusSongList()
}

const onSongListKeydown = (event) => {
  if (selectedSongIndex.value === null) return

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveSelectedSong(-1)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveSelectedSong(1)
  } else if (event.key === 'PageUp') {
    event.preventDefault()
    moveSelectedSong(-5)
  } else if (event.key === 'PageDown') {
    event.preventDefault()
    moveSelectedSong(5)
  }
}
</script>

<style scoped>
.missing-song-id { display: block; color: var(--ms-warning); font-size: 10px; overflow-wrap: anywhere; white-space: normal; margin-top: 5px; }
.collection-edit-modal {
  max-width: 500px;
  width: 90%;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 10px;
  font-weight: 600;
  color: var(--ui-text-primary);
  border-bottom: 1px solid var(--ui-border);
  padding-bottom: 5px;
}

.add-song-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--ui-accent);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.2s;
}
.add-song-toggle:hover {
  opacity: 0.8;
}

.add-song-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.song-search-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  color: var(--ui-text-primary);
  border-radius: 8px;
  outline: none;
}

.song-search-input:focus {
  border-color: var(--ui-accent);
}

.add-song-selector {
  background: var(--ui-bg-surface);
  border-radius: 12px;
  border: 1px solid var(--ui-border);
  padding: 10px;
  max-height: 150px;
  overflow-y: auto;
}

.available-song-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 14px;
}

.small-btn {
  padding: 4px 12px;
  font-size: 11px;
  background: var(--ui-accent);
  color: #ffffff;
  border: 1px solid transparent;
  border-radius: var(--ms-radius-sm);
  cursor: pointer;
  box-shadow: none;
  transition: all 0.2s;
}

.small-btn:hover {
  background: var(--ui-accent-hover);
}

.current-songs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
  outline: none;
}

.collection-song-item {
  display: flex;
  align-items: center;
  background: var(--ui-bg-surface);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 4px 8px;
  gap: 8px;
  transition: all 0.2s;
  cursor: default;
}
.collection-song-item:hover {
  background: var(--ui-bg-hover);
}

.collection-song-item.is-selected {
  border-color: var(--ui-accent);
  background: var(--ui-bg-active);
}

.collection-song-item.is-dragging {
  opacity: 0.5;
  background: var(--ui-bg-active);
}

.collection-song-item.is-drag-over.drag-up {
  border-top: 2px solid var(--ui-accent);
}

.collection-song-item.is-drag-over.drag-down {
  border-bottom: 2px solid var(--ui-accent);
}

.song-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-icon {
  color: var(--ui-text-secondary);
  cursor: grab;
  font-size: 20px;
  transition: color 0.2s;
}

.drag-icon:hover {
  color: var(--ui-text-primary);
}

.drag-icon:active {
  cursor: grabbing;
}

.song-position {
  width: 28px;
  flex: 0 0 28px;
  color: var(--ui-text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  user-select: none;
}

.song-name {
  flex: 1;
  font-size: 14px;
  cursor: pointer;
  color: var(--ui-accent);
  transition: color 0.2s;
}

.song-name:hover {
  text-decoration: underline;
  color: var(--ui-accent-hover);
}

.remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ui-danger);
  transition: color 0.2s;
}

.remove-btn:hover {
  color: var(--ui-danger-hover);
}

.empty-list, .no-songs {
  text-align: center;
  color: var(--ui-text-secondary);
  font-size: 13px;
  padding: 10px;
}
</style>
