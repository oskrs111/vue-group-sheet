<template>
  <div class="editable-container">
    <div class="name-display" :class="{ 'placeholder': !store.header.center.top.name }">
      {{ store.header.center.top.name || 'Nueva Canción' }}
    </div>
    <button aria-label="Editar nombre de la canción" class="edit-btn" @click="showModal = true">
      <AppIcon name="edit" />
    </button>
    
    <div v-dialog v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">Editar Nombre de la Canción</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre:</label>
            <input 
              type="text" 
              v-model="localName" 
              placeholder="Nueva Canción"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="showModal = false">Cancelar</button>
          <button class="primary" @click="save">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const store = useSheetStore()
const showModal = ref(false)
const localName = ref(store.header.center.top.name)

const save = () => {
  store.updateName(localName.value)
  showModal.value = false
}
</script>

<style scoped>
.name-display {
  font-size: 28px;
  font-weight: bold;
}

.name-display.placeholder {
  color: #cccccc;
  font-style: italic;
}
</style>
