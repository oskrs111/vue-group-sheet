<template>
  <div class="editable-container">
    <div class="author-display">{{ store.header.center.bottom.author }}</div>
    <button class="edit-btn" @click="showModal = true">
      <span class="material-icons">edit</span>
    </button>
    
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">Editar Autor</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Autor:</label>
            <input type="text" v-model="localAuthor" />
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
const localAuthor = ref(store.header.center.bottom.author)

const save = () => {
  store.updateAuthor(localAuthor.value)
  showModal.value = false
}
</script>

<style scoped>
.author-display {
  font-size: 16px;
  font-style: italic;
}
</style>
