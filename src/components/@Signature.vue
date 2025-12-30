<template>
  <div class="editable-container">
    <div class="signature-display">{{ store.header.left.bottom.signature }}</div>
    <button class="edit-btn" @click="showModal = true">
      <span class="material-icons">edit</span>
    </button>
    
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">Editar Compás</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Compás:</label>
            <select v-model="localSignature">
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
            </select>
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
const localSignature = ref(store.header.left.bottom.signature)

const save = () => {
  store.updateSignature(localSignature.value)
  showModal.value = false
}
</script>

<style scoped>
.signature-display {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}
</style>
