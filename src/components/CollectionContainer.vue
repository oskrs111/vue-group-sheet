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
            <button class="primary" @click="createCollection">Crear</button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        v-model="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :confirmText="confirmState.confirmText"
        :isDanger="confirmState.isDanger"
        @confirm="confirmState.onConfirm"
        @cancel="confirmState.onCancel"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCollectionStore } from '../stores/collectionStore'
import { useSheetStore } from '../stores/sheetStore'
import { useNotificationStore } from '../stores/notificationStore'
import CollectionItem from './CollectionItem.vue'
import ConfirmDialog from './UI/ConfirmDialog.vue'

const store = useCollectionStore()
const sheetStore = useSheetStore()
const notification = useNotificationStore()
const isCollapsed = ref(false)
const showCreateDialog = ref(false)
const newCollectionName = ref('')
const fileInput = ref(null)

const confirmState = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Aceptar',
  isDanger: false,
  onConfirm: () => {},
  onCancel: () => {}
})

const askConfirm = (options) => {
  return new Promise((resolve) => {
    confirmState.value = {
      show: true,
      title: options.title || 'Confirmar',
      message: options.message || '¿Estás seguro?',
      confirmText: options.confirmText || 'Aceptar',
      isDanger: options.isDanger || false,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    }
  })
}

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
        const importCopy = await askConfirm({
            title: 'Colección Existente',
            message: `La colección "${finalCollectionName}" ya existe.<br>¿Deseas importarla como una copia?`
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
                title: 'Conflicto de Versión',
                message: `La canción "${song.name}" ya existe pero la versión importada es más reciente.<br><br>Local: ${existingSong.updatedAt}<br>Importada: ${song.updatedAt}<br><br>¿Deseas sobrescribirla?`
            })
            if (overwrite) {
              songsRegistry.songs[song.id] = song
              updatedSongsCount++
            }
          } else if (existingSong.updatedAt !== song.updatedAt) {
             // Fechas distintas pero no necesariamente más reciente (o sin fecha), preguntar igual por si acaso
             const overwrite = await askConfirm({
                 title: 'Conflicto de Canción',
                 message: `La canción "${song.name}" ya existe con una fecha diferente.<br><br>¿Deseas sobrescribirla con la versión importada?`
             })
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
        `Importación completada.<br>- Canciones nuevas: ${importedSongsCount}<br>- Canciones actualizadas: ${updatedSongsCount}<br>- Colección "${finalCollectionName}" añadida.`,
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
.collections-panel {
  width: 300px;
  height: 100vh;
  background: var(--ui-bg-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-left: 1px solid var(--ui-border);
  position: fixed;
  right: 0;
  top: 0;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
  border-radius: 9999px;
  background: var(--ui-bg-surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--ui-border);
  color: var(--ui-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  z-index: 101;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  filter: brightness(1.2);
  border-color: var(--ui-border-focus);
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
  color: var(--ui-text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--ui-border);
  cursor: pointer;
  color: var(--ui-text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.icon-btn:hover {
  background-color: var(--ui-bg-hover);
  color: var(--ui-text-primary);
  border-color: rgba(255, 255, 255, 0.3);
}

.add-collection-btn {
  padding: 0 16px;
  height: 36px;
  background: var(--ui-accent);
  color: white;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  box-shadow: var(--ui-glow-primary);
  transition: all 0.3s ease;
}

.add-collection-btn:hover {
  background: var(--ui-accent-hover);
  box-shadow: 0 0 25px rgba(96, 165, 250, 0.6);
  transform: translateY(-1px);
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-collections {
  text-align: center;
  color: var(--ui-text-secondary);
  padding: 20px;
  font-size: 14px;
}
</style>
