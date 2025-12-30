<template>
  <div class="editable-container">
    <div class="tempo-display">{{ store.header.left.top.tempo }} BPM</div>
    <button class="edit-btn" @click="showModal = true">
      <span class="material-icons">edit</span>
    </button>
    
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">Editar Tempo</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tempo (BPM):</label>
            <input 
              type="number" 
              v-model.number="localTempo" 
              min="10" 
              max="300"
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
const localTempo = ref(store.header.left.top.tempo)

const save = () => {
  store.updateTempo(localTempo.value.toString())
  showModal.value = false
}
</script>

<style scoped>
.tempo-display {
  font-size: 24px;
  font-weight: bold;
}
</style>
