<template>
  <div v-dialog class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content settings-modal">
      <div class="modal-header">Configuración</div>
      <div class="modal-body">
        <div v-if="desktopSettings" class="desktop-options">
          <h3>Opciones de escritorio</h3>
          <div class="form-group">
            <label for="workspace-folder">Carpeta de trabajo:</label>
            <input id="workspace-folder" :value="desktopSettings.workspace" readonly />
            <button type="button" class="secondary" :disabled="choosingWorkspace" @click="chooseWorkspace">Cambiar carpeta…</button>
            <small>Se abrirán las canciones y colecciones de la carpeta seleccionada.</small>
          </div>
          <div class="form-group">
            <label for="backup-interval">Copia automática cada (minutos):</label>
            <input id="backup-interval" type="number" min="0" max="1440" step="1" v-model.number="desktopSettings.backupMinutes" />
            <small>0 desactiva la copia automática. Las copias se conservan en Backup.</small>
          </div>
          <button type="button" class="secondary" @click="createBackup">Crear copia ahora</button>
          <p v-if="backupMessage" class="desktop-message" role="status">{{ backupMessage }}</p>
        </div>
        <div class="form-group">
          <label>Orientación de página:</label>
          <select v-model="localSettings.page_orientation">
            <option value="V">Vertical</option>
            <option value="H">Horizontal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Color de fuente por defecto:</label>
          <ColorPickerWithHistory v-model="localSettings.f_color_default" />
        </div>
        <div class="form-group">
          <label>Forma por defecto:</label>
          <select v-model="localSettings.shape_default">
            <option value="S">Cuadrado</option>
            <option value="C">Redondeado</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sheet-font">Fuente de la hoja:</label>
          <select id="sheet-font" v-model="localSettings.font_family" aria-describedby="sheet-font-help">
            <option :value="DEFAULT_SHEET_FONT">Recovered Chords Std</option>
            <option value="Libre Baskerville">Libre Baskerville</option>
            <option value="Momo Trust Display">Momo Trust Display</option>
            <option value="Oswald">Oswald</option>
          </select>
          <small id="sheet-font-help">Se aplica a todos los textos y acordes de esta canción. Recovered Chords Std es parcial: los caracteres ausentes usan Libre Baskerville.</small>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="localSettings.show_notes" />
            Mostrar apartado de notas
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="localSettings.show_lyrics" />
            Mostrar página de letras
          </label>
        </div>
      </div>
      <p v-if="saveError" class="desktop-error" role="alert">{{ saveError }}</p>
      <div class="modal-footer">
        <button class="secondary" @click="$emit('close')">Cancelar</button>
        <button class="primary" @click="save">Guardar ajustes</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import ColorPickerWithHistory from './ColorPickerWithHistory.vue'
import { DEFAULT_SHEET_FONT, normalizeSheetFontSettings } from '../utils/sheetFonts'

const emit = defineEmits(['close'])
const store = useSheetStore()

const localSettings = ref(normalizeSheetFontSettings(store.settings))
const desktopSettings = ref(window.electronAPI?.getSettings() || null)
const choosingWorkspace = ref(false)
const saveError = ref('')
const backupMessage = ref('')

const chooseWorkspace = async () => {
  choosingWorkspace.value = true
  saveError.value = ''
  try {
    await window.electronAPI.chooseWorkspace()
  } catch (error) {
    saveError.value = error.message
  } finally {
    choosingWorkspace.value = false
  }
}

const createBackup = () => {
  saveError.value = ''
  try {
    backupMessage.value = 'Copia creada: ' + window.electronAPI.createBackup()
  } catch (error) {
    saveError.value = error.message
  }
}

const save = () => {
  saveError.value = ''
  try {
    if (desktopSettings.value) window.electronAPI.saveSettings(desktopSettings.value.backupMinutes)
    store.updateSettings(localSettings.value)
    emit('close')
  } catch (error) {
    saveError.value = error.message
  }
}
</script>

<style scoped>
.settings-modal { display: flex; flex-direction: column; max-height: 90vh; min-width: 0; width: min(600px, calc(100vw - 32px)); }
.settings-modal .modal-body { overflow-y: auto; min-height: 0; }
.settings-modal .modal-header, .settings-modal .modal-footer { flex-shrink: 0; }
.desktop-options {
  border-bottom: 1px solid var(--ui-border);
  padding-bottom: 16px;
  margin-bottom: 16px;
}
.desktop-options h3 { color: var(--ui-text-primary); margin: 0 0 16px; }
.desktop-options small { display: block; color: var(--ui-text-secondary); margin-top: 8px; }
.desktop-options input { width: 100%; box-sizing: border-box; margin-bottom: 8px; }
.desktop-message { color: var(--ui-text-secondary); overflow-wrap: anywhere; }
.desktop-error { color: var(--ui-danger); margin: 0 20px 16px; }
</style>
