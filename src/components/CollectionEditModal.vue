<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content collection-edit-modal">
      <div class="modal-header">Editar Colección</div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Nombre de la Colección:</label>
          <input v-model="editName" type="text" @blur="updateName" />
        </div>

        <div class="songs-management">
          <div class="section-title">
            <span>Canciones en la Colección</span>
            <button class="add-song-toggle" @click="showAddSong = !showAddSong">
              <span class="material-icons">{{ showAddSong ? 'remove' : 'add' }}</span>
              {{ showAddSong ? 'Cerrar' : 'Añadir Canción' }}
            </button>
          </div>

          <!-- Selector de canciones para añadir -->
          <div v-if="showAddSong" class="add-song-selector">
            <div v-if="availableSongs.length === 0" class="no-songs">
              No hay más canciones disponibles
            </div>
            <div v-for="song in availableSongs" :key="song.id" class="available-song-item">
              <span>{{ song.name }}</span>
              <button @click="addSong(song.id)" class="small-btn">Añadir</button>
            </div>
          </div>

          <!-- Lista de canciones actual con reordenación -->
          <div class="current-songs-list">
            <div v-if="collectionSongs.length === 0" class="empty-list">
              No hay canciones en esta colección
            </div>
            <div v-for="(song, index) in collectionSongs" :key="song.id" class="collection-song-item">
              <div class="song-drag-handle">
                <button @click="moveUp(index)" :disabled="index === 0" class="move-btn">
                  <span class="material-icons">expand_less</span>
                </button>
                <button @click="moveDown(index)" :disabled="index === collectionSongs.length - 1" class="move-btn">
                  <span class="material-icons">expand_more</span>
                </button>
              </div>
              <span class="song-name">{{ song.name }}</span>
              <button @click="removeSong(song.id)" class="remove-btn" title="Quitar">
                <span class="material-icons">close</span>
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const store = useCollectionStore()
const sheetStore = useSheetStore()

const editName = ref(props.collection.name)
const showAddSong = ref(false)

const allSongs = computed(() => sheetStore.getSongsList())

const collectionSongs = computed(() => {
  return props.collection.songs.map(id => {
    return allSongs.value.find(s => s.id === id) || { id, name: 'Canción no encontrada' }
  })
})

const availableSongs = computed(() => {
  return allSongs.value.filter(song => !props.collection.songs.includes(song.id))
})

const updateName = () => {
  if (editName.value.trim() && editName.value !== props.collection.name) {
    store.updateCollection(props.collection.id, { name: editName.value.trim() })
  }
}

const addSong = (songId) => {
  store.addSongToCollection(props.collection.id, songId)
}

const removeSong = (songId) => {
  store.removeSongFromCollection(props.collection.id, songId)
}

const moveUp = (index) => {
  if (index > 0) {
    store.moveSongInCollection(props.collection.id, index, index - 1)
  }
}

const moveDown = (index) => {
  if (index < props.collection.songs.length - 1) {
    store.moveSongInCollection(props.collection.id, index, index + 1)
  }
}
</script>

<style scoped>
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
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.add-song-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.add-song-selector {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
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
  padding: 2px 8px;
  font-size: 11px;
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 3px;
  cursor: pointer;
}

.current-songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collection-song-item {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  gap: 10px;
}

.song-drag-handle {
  display: flex;
  flex-direction: column;
}

.move-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: #888;
}

.move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.move-btn .material-icons {
  font-size: 18px;
}

.song-name {
  flex: 1;
  font-size: 14px;
}

.remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #d32f2f;
}

.empty-list, .no-songs {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 10px;
}
</style>
