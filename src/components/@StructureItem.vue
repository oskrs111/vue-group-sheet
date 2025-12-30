<template>
  <div class="structure-item-wrapper">
    <div 
      class="structure-item editable-container"
      :style="{ 
        backgroundColor: item.b_color, 
        color: item.f_color,
        borderRadius: item.shape === 'C' ? '40px' : '0'
      }"
    >
      <span class="item-id">{{ item.id }}</span>
    </div>
    <div class="structure-header">
      <button @click="showEditModal = true" class="structure-edit-btn">
        <span class="material-icons">edit</span>
      </button>
      <button @click="showDeleteModal = true" class="delete-btn-small">
        <span class="material-icons">close</span>
      </button>
    </div>
    
    <Teleport to="#modal-container">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
        <div class="modal-header">Editar Elemento de Estructura</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Sección:</label>
            <select v-model="localData.id">
              <option v-for="section in store.body" :key="section.id" :value="section.id">
                {{ section.id }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Forma:</label>
            <select v-model="localData.shape">
              <option value="S">Cuadrado</option>
              <option value="C">Redondeado</option>
            </select>
          </div>
          <div class="form-group">
            <label>Color de Fondo:</label>
            <input type="color" v-model="localData.b_color" />
          </div>
          <div class="form-group">
            <label>Color de Fuente:</label>
            <input type="color" v-model="localData.f_color" />
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
          <p>¿Está seguro de que desea eliminar este elemento?</p>
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
  item: Object,
  index: Number
})

const store = useSheetStore()
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const localData = ref(JSON.parse(JSON.stringify(props.item)))

const save = () => {
  store.updateStructureItem(props.index, localData.value)
  showEditModal.value = false
}

const confirmDelete = () => {
  store.deleteStructureItem(props.index)
  showDeleteModal.value = false
}
</script>

<style scoped>
.structure-item-wrapper {
  position: relative;
  width: 81px;
  height: 81px;
}

.structure-item {
  width: 80px;
  height: 80px;
  border: 2px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  font-weight: bold;
}

.item-id {
  user-select: none;
}

.structure-header {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.structure-edit-btn {
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

.structure-item-wrapper:hover .structure-edit-btn {
  opacity: 0.6;
}

.structure-edit-btn:hover {
  opacity: 1 !important;
  color: #1976d2;
}

.structure-header .delete-btn-small {
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

.structure-item-wrapper:hover .structure-header .delete-btn-small {
  opacity: 0.6;
}

.structure-header .delete-btn-small:hover {
  opacity: 1 !important;
  color: red;
}
</style>
