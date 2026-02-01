<template>
  <div class="editable-container">
    <div class="tone-display">{{ store.header.right.top.tone }}</div>
    <button class="edit-btn" @click="showModal = true">
      <span class="material-icons">edit</span>
    </button>
    
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">Editar Tono</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tono:</label>
            <input 
              type="text" 
              v-model="localTone" 
              maxlength="4"
              placeholder="C, D#, Eb, etc."
            />
            <small>Nota: C, D, E, F, G, A, B + opcional # o b</small>
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
const localTone = ref(store.header.right.top.tone)

const save = () => {
  store.updateTone(localTone.value)
  showModal.value = false
}
</script>

<style scoped>
.tone-display {
  font-size: 24px;
  font-weight: bold;
}
</style>
