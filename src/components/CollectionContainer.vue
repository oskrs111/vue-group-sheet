<template>
  <div class="collections-panel" :class="{ collapsed: isCollapsed }">
    <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
      <span class="material-icons">{{ isCollapsed ? 'chevron_left' : 'chevron_right' }}</span>
    </button>
    
    <div class="collections-content" v-show="!isCollapsed">
      <div class="collections-header">
        <h3>Colecciones</h3>
        <div class="header-actions">
          <button @click="triggerImport" class="icon-btn" title="Importar Colección">
            <span class="material-icons">file_upload</span>
          </button>
          <button class="add-collection-btn" @click="showCreateDialog = true">
            <span class="material-icons">add</span>
            <span>Crear</span>
          </button>
        </div>
        <input type="file" ref="fileInput" accept=".json" style="display: none" @change="handleFileImport" />
      </div>

      <div class="collections-list">
        <div v-if="collections.length === 0" class="empty-collections">
          No hay colecciones creadas
        </div>
        <CollectionItem 
          v-for="collection in collections" 
          :key="collection.id" 
          :collection="collection" 
        />
      </div>
    </div>

    <!-- Modal Crear Colección -->
    <Teleport to="#modal-container">
      <div v-if="showCreateDialog" class="modal-overlay" @click.self="showCreateDialog = false">
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
            <button class="primary" @click="createCollection">Crear</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'
import CollectionItem from './CollectionItem.vue'

const store = useCollectionStore()
const sheetStore = useSheetStore()
const isCollapsed = ref(false)
const showCreateDialog = ref(false)
const newCollectionName = ref('')
const fileInput = ref(null)

const collections = computed(() => store.collections)

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
        if (!confirm(`La colección "${finalCollectionName}" ya existe.\n¿Deseas importarla como una copia?`)) {
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
            if (confirm(`La canción "${song.name}" ya existe pero la versión importada es más reciente.\n\nLocal: ${existingSong.updatedAt}\nImportada: ${song.updatedAt}\n\n¿Deseas sobrescribirla?`)) {
              songsRegistry.songs[song.id] = song
              updatedSongsCount++
            }
          } else if (existingSong.updatedAt !== song.updatedAt) {
             // Fechas distintas pero no necesariamente más reciente (o sin fecha), preguntar igual por si acaso
             if (confirm(`La canción "${song.name}" ya existe con una fecha diferente.\n\n¿Deseas sobrescribirla con la versión importada?`)) {
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

      alert(`Importación completada.\n- Canciones nuevas: ${importedSongsCount}\n- Canciones actualizadas: ${updatedSongsCount}\n- Colección "${finalCollectionName}" añadida.`)

    } catch (error) {
      console.error('Error importando:', error)
      alert('Error al importar el archivo: ' + error.message)
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
.collections-panel {
  width: 300px;
  height: 100vh;
  background: #f8f9fa;
  border-left: 1px solid #e0e0e0;
  position: fixed;
  right: 0;
  top: 0;
  transition: width 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.collections-panel.collapsed {
  width: 40px;
}

.collapse-btn {
  position: absolute;
  left: -20px;
  top: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 101;
}

.collections-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.collections-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collections-header h3 {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: white;
  border: 1px solid #ddd;
  cursor: pointer;
  color: #666;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: #f0f0f0;
  color: #333;
  border-color: #ccc;
}

.add-collection-btn {
  padding: 0 12px;
  height: 36px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: background 0.2s;
}

.add-collection-btn:hover {
  background: #1565c0;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-collections {
  text-align: center;
  color: #888;
  padding: 20px;
  font-size: 14px;
}
</style>
