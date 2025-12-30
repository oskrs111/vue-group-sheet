<template>
  <div class="structure-container">
    <div class="structure-header">
      <h3>Estructura</h3>
      <div class="header-controls">
        <div class="zoom-control">
          <button @click="decreaseZoom" class="zoom-btn" title="Reducir zoom">
            <span class="material-icons">zoom_out</span>
          </button>
          <span class="zoom-label">{{ store.settings.zoom_structure }}%</span>
          <button @click="increaseZoom" class="zoom-btn" title="Aumentar zoom">
            <span class="material-icons">zoom_in</span>
          </button>
        </div>
        <button @click="addStructureItem" class="add-btn">
          <span class="material-icons">add</span>
        </button>
      </div>
    </div>
    <div class="structure-items" :style="{ transform: `scale(${store.settings.zoom_structure / 100})`, transformOrigin: 'top left' }">
      <StructureItemComponent
        v-for="(item, index) in store.structure"
        :key="index"
        :item="item"
        :index="index"
      />
    </div>
  </div>
</template>

<script setup>
import { useSheetStore } from '../stores/sheetStore'
import StructureItemComponent from './@StructureItem.vue'

const store = useSheetStore()

const addStructureItem = () => {
  store.addStructureItem()
}

const increaseZoom = () => {
  const newZoom = Math.min(store.settings.zoom_structure + 10, 200)
  store.updateSettings({ zoom_structure: newZoom })
}

const decreaseZoom = () => {
  const newZoom = Math.max(store.settings.zoom_structure - 10, 50)
  store.updateSettings({ zoom_structure: newZoom })
}
</script>

<style scoped>
.structure-container {
  margin-bottom: 30px;
  padding-top: 20px;
}

.structure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.structure-header h3 {
  font-size: 20px;
  font-weight: bold;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.zoom-btn {
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.zoom-btn:hover {
  background: #e0e0e0;
}

.zoom-btn .material-icons {
  font-size: 20px;
}

.zoom-label {
  font-size: 14px;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
}

/* add-btn usa estilos globales */

.structure-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: fit-content;
}
</style>
