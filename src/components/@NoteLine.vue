<template>
  <div class="note-line editable-container">
    <span class="note-text">{{ note.text }}</span>
    <div class="note-header">
      <button @click="showEditModal = true" class="note-edit-btn">
        <span class="material-icons">edit</span>
      </button>
      <button @click="showDeleteModal = true" class="delete-btn-small">
        <span class="material-icons">close</span>
      </button>
    </div>
    
    <Teleport to="#modal-container">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
          <div class="modal-header">Editar Nota</div>
          <div class="modal-body">
            <div class="form-group">
              <label>Texto:</label>
              <textarea v-model="localText" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showEditModal = false">Cancelar</button>
            <button class="primary" @click="save">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <Teleport to="#modal-container">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content">
          <div class="modal-header">Confirmar Eliminación</div>
          <div class="modal-body">
            <p>¿Está seguro de que desea eliminar esta nota?</p>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="showDeleteModal = false">Cancelar</button>
            <button class="primary" @click="confirmDelete">Eliminar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const props = defineProps({
  note: Object,
  index: Number
})

const store = useSheetStore()
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const localText = ref(props.note.text)

const save = () => {
  store.updateNote(props.index, localText.value)
  showEditModal.value = false
}

const confirmDelete = () => {
  store.deleteNote(props.index)
  showDeleteModal.value = false
}
</script>

<style scoped>
.note-line {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 0px solid #ccc;
  border-radius: 4px;
  position: relative;
  min-height: 40px;
}

.note-text {
  flex: 1;
  padding: 0 30px; /* Add padding to avoid overlap with buttons */
}

.note-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  pointer-events: none;
}

.note-edit-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 2px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.note-line:hover .note-edit-btn {
  opacity: 0.6;
}

.note-edit-btn:hover {
  opacity: 1 !important;
  color: #1976d2;
}

.note-header .delete-btn-small {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 2px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: auto;
}

.note-line:hover .note-header .delete-btn-small {
  opacity: 0.6;
}

.note-header .delete-btn-small:hover {
  opacity: 1 !important;
  color: red;
}
</style>
