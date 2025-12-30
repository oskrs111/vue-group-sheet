<template>
  <div class="notes-container">
    <div class="notes-header">
      <h3>Notas</h3>
      <button @click="addNote" class="add-btn">
        <span class="material-icons">add</span>
      </button>
    </div>
    <div class="notes-list">
      <NoteLineComponent
        v-for="(note, index) in store.notes"
        :key="note.id"
        :note="note"
        :index="index"
      />
    </div>
  </div>
</template>

<script setup>
import { useSheetStore } from '../stores/sheetStore'
import NoteLineComponent from './@NoteLine.vue'

const store = useSheetStore()

const addNote = () => {
  store.addNote()
}
</script>

<style scoped>
.notes-container {
  padding-top: 20px;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.notes-header h3 {
  font-size: 20px;
  font-weight: bold;
}

/* add-btn usa estilos globales */

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
