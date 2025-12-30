<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">Configuración</div>
      <div class="modal-body">
        <div class="form-group">
          <label>Orientación de página:</label>
          <select v-model="localSettings.page_orientation">
            <option value="V">Vertical</option>
            <option value="H">Horizontal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Color de fondo por defecto:</label>
          <input type="color" v-model="localSettings.b_color_default" />
        </div>
        <div class="form-group">
          <label>Color de fuente por defecto:</label>
          <input type="color" v-model="localSettings.f_color_default" />
        </div>
        <div class="form-group">
          <label>Forma por defecto:</label>
          <select v-model="localSettings.shape_default">
            <option value="S">Cuadrado</option>
            <option value="C">Redondeado</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fuente:</label>
          <select v-model="localSettings.font_family">
            <option value="Libre Baskerville">Libre Baskerville</option>
            <option value="Momo Trust Display">Momo Trust Display</option>
            <option value="Oswald">Oswald</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="localSettings.show_notes" />
            Mostrar apartado de notas
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="secondary" @click="$emit('close')">Cancelar</button>
        <button class="primary" @click="save">Guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSheetStore } from '../stores/sheetStore'

const emit = defineEmits(['close'])
const store = useSheetStore()

const localSettings = ref({ ...store.settings })

const save = () => {
  store.updateSettings(localSettings.value)
  emit('close')
}
</script>
