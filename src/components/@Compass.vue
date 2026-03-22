<template>
  <div
    v-if="!isSpaceCompass"
    class="compass-box editable-container"
    :class="{ selected: isCompassSelected }"
    @click.stop="selectCompass"
  >
    <div class="compass-header">
      <button @click.stop="copyCompass" class="compass-copy-btn" title="Copiar compás">
        <span class="material-icons">content_copy</span>
      </button>
    </div>

    <div class="chords-display" v-if="!isRepeatCompass">
      <ChordComponent
        v-for="(chord, index) in compass.chords"
        :key="index"
        :chord="chord"
      />
    </div>

    <div class="repeat-symbol" v-else>
      %
    </div>
  </div>

  <template v-else>
    <div
      class="compass-break-filler"
      :class="{ selected: isCompassSelected }"
      @click.stop="selectCompass"
    >
      <div class="break-display">
        <span class="break-label">Salto de línea</span>
      </div>

      <div class="compass-header">
        <button @click.stop="copyCompass" class="compass-copy-btn" title="Copiar compás">
          <span class="material-icons">content_copy</span>
        </button>
      </div>
    </div>
    <div class="compass-break-force"></div>
  </template>

  <Teleport to="#modal-container">
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content modal-compass-edit">
        <div class="modal-header">Editar Compás</div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tipo de Compás:</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="compassType"
                  value="normal"
                  @change="handleCompassTypeChange"
                />
                <span>Normal</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="compassType"
                  value="repeat"
                  @change="handleCompassTypeChange"
                />
                <span>Repetición (%)</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="compassType"
                  value="space"
                  @change="handleCompassTypeChange"
                />
                <span>Salto de línea</span>
              </label>
            </div>
          </div>

          <div v-if="compassType === 'normal'" class="chords-container">
            <div v-for="(chord, idx) in localChords" :key="idx" class="chord-editor">
              <div class="form-group">
                <div class="chord-label-row">
                  <label>Acorde {{ idx + 1 }}:</label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="chord.chord === 'REST'"
                      @change="toggleRest(idx, $event)"
                    />
                    <span>Silencio</span>
                  </label>
                </div>

                <div v-if="chord.chord !== 'REST'" class="input-with-help">
                  <input
                    type="text"
                    v-model="chord.chord"
                    @input="validateChord(idx)"
                    placeholder="Ej: C, Dm"
                    class="chord-input"
                  />
                  <button class="help-btn" @click="showHelpModal = true" title="Ver caracteres permitidos">
                    <span class="material-icons">help_outline</span>
                  </button>
                </div>
                <div v-else class="rest-placeholder">
                  Silencio musical
                </div>

                <small v-if="chordErrors[idx]" class="error-text">
                  {{ chordErrors[idx] }}
                </small>
              </div>
              <div class="form-group">
                <label>Duración:</label>
                <div class="radio-group duration-radio-group">
                  <label class="radio-option">
                    <input type="radio" v-model.number="chord.div" :value="1" />
                    <span>Redonda</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" v-model.number="chord.div" :value="5" />
                    <span>Blanca p.</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" v-model.number="chord.div" :value="2" />
                    <span>Blanca</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" v-model.number="chord.div" :value="3" />
                    <span>Negra</span>
                  </label>
                </div>
              </div>
              <button @click="removeChord(idx)" class="delete-btn-small" title="Eliminar acorde">
                <span class="material-icons">close</span>
              </button>
            </div>
            <button @click="addChord" class="add-btn" title="Añadir acorde">
              <span class="material-icons">add</span>
            </button>
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
          <p>¿Está seguro de que desea eliminar este compás?</p>
        </div>
        <div class="modal-footer">
          <button class="secondary" @click="showDeleteModal = false">Cancelar</button>
          <button class="primary" @click="confirmDelete">Eliminar</button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="#modal-container">
    <div v-if="showHelpModal" class="modal-overlay" @click.self="showHelpModal = false">
      <div class="modal-content">
        <div class="modal-header">Caracteres Permitidos</div>
        <div class="modal-body">
          <p>Sintaxis Jazz y caracteres permitidos:</p>
          <ul style="text-align: left; margin: 10px 0; padding-left: 20px; line-height: 1.4;">
            <li><strong>Mayor / Menor:</strong> `M`, `maj` / `m`, `-`</li>
            <li><strong>Extensiones:</strong> `7`, `9`, `11`, `13`, `sus2`, `sus4`</li>
            <li><strong>Alterados:</strong> `dim`, `o`, `m7b5`, `ø`</li>
            <li><strong>Aumentados:</strong> `aug`, `+`</li>
            <li><strong>Bajos / Inversiones:</strong> `/`, `\` (ej. C/E, A\C#)</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="primary" @click="showHelpModal = false">Entendido</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSheetStore } from '../stores/sheetStore'
import ChordComponent from './@Chord.vue'

const props = defineProps({
  compass: Object,
  sectionIndex: Number,
  compassIndex: Number
})

const store = useSheetStore()
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showHelpModal = ref(false)
const localChords = ref([])
const chordErrors = ref({})
const compassType = ref('normal')

const allowedChars = /^[CDEFGABMmb#7913sus24altdimag/\\+oø-]*$/

const getCompassType = (chords = []) => {
  if (chords.length === 1 && chords[0].chord === 'R') return 'repeat'
  if (chords.length === 1 && chords[0].chord === 'S') return 'space'
  return 'normal'
}

const syncLocalState = () => {
  localChords.value = JSON.parse(JSON.stringify(props.compass.chords))
  chordErrors.value = {}
  compassType.value = getCompassType(props.compass.chords)
}

watch(() => props.compass.chords, syncLocalState, { deep: true, immediate: true })

const isRepeatCompass = computed(() => {
  return props.compass.chords.length === 1 && props.compass.chords[0].chord === 'R'
})

const isSpaceCompass = computed(() => {
  return props.compass.chords.length === 1 && props.compass.chords[0].chord === 'S'
})

const isCompassSelected = computed(() => {
  return store.selectedCompass &&
    store.selectedCompass.sIndex === props.sectionIndex &&
    store.selectedCompass.cIndex === props.compassIndex
})

const selectCompass = () => {
  store.setSelectedCompass(props.sectionIndex, props.compassIndex)
}

const openEditModal = () => {
  syncLocalState()
  showEditModal.value = true
}

const openDeleteModal = () => {
  showDeleteModal.value = true
}

const toggleRest = (index, event) => {
  const isChecked = event.target.checked
  if (isChecked) {
    localChords.value[index].chord = 'REST'
    delete chordErrors.value[index]
  } else {
    localChords.value[index].chord = 'C'
  }
}

const validateChord = (index) => {
  const chord = localChords.value[index]
  const chordString = chord.chord || ''

  if (chordString === 'REST') return

  if (!allowedChars.test(chordString)) {
    chordErrors.value[index] = 'Caracteres no válidos detectados'
    chord.chord = chordString.replace(/[^CDEFGABMmb#7913sus24altdimag/\\+oø-]/g, '')
    return
  }

  if (chordString.length > 0 && !/^[CDEFGAB]/.test(chordString)) {
    chordErrors.value[index] = 'El primer carácter debe ser una nota (C,D,E,F,G,A,B)'
    return
  }

  delete chordErrors.value[index]
}

const handleCompassTypeChange = () => {
  if (compassType.value === 'repeat') {
    localChords.value = [{ chord: 'R' }]
  } else if (compassType.value === 'space') {
    localChords.value = [{ chord: 'S' }]
  } else if (!localChords.value.length || localChords.value[0].chord === 'R' || localChords.value[0].chord === 'S') {
    localChords.value = [{ chord: 'C', div: 1 }]
  }

  chordErrors.value = {}
}

const save = () => {
  if (Object.keys(chordErrors.value).length > 0) {
    alert('Por favor, corrija los errores antes de guardar')
    return
  }

  store.updateCompass(props.sectionIndex, props.compassIndex, localChords.value)
  showEditModal.value = false
}

const addChord = () => {
  localChords.value.push({ chord: 'C', div: 1 })
}

const removeChord = (index) => {
  localChords.value.splice(index, 1)
  delete chordErrors.value[index]
}

const confirmDelete = () => {
  store.deleteCompass(props.sectionIndex, props.compassIndex)
  showDeleteModal.value = false
}

const copyCompass = () => {
  store.copyCompass(props.sectionIndex, props.compassIndex)
}

defineExpose({
  openEditModal,
  openDeleteModal,
  copyCompass
})
</script>

<style scoped>
.compass-box {
  border: 1px solid #666;
  padding: 5px;
  min-width: 50px;
  position: relative;
  border-radius: 0;
  cursor: pointer;
}

.selected {
  border-color: #1976d2 !important;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.5);
  background-color: rgba(25, 118, 210, 0.1);
}

.compass-header {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.compass-copy-btn {
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

.compass-box:hover .compass-copy-btn,
.compass-break-filler:hover .compass-copy-btn {
  opacity: 0.6;
}

.compass-copy-btn:hover {
  opacity: 1 !important;
  color: #1976d2;
}

.chords-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

.repeat-symbol {
  padding-top: 22px;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compass-break-filler {
  flex-grow: 1;
  min-width: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  border: 1px dashed #ccc;
  background-color: #f9f9f9;
}

.compass-break-filler:hover {
  background-color: #f0f0f0;
}

.compass-break-force {
  width: 100%;
  height: 0;
}

.break-display {
  padding: 10px;
}

.break-label {
  font-size: 12px;
  color: #999;
  font-style: italic;
  white-space: nowrap;
}

.modal-compass-edit {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-compass-edit .modal-body {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.chords-container {
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 0;
  align-items: flex-start;
}

.chord-editor {
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 4px;
  min-width: 150px;
  flex-shrink: 0;
  position: relative;
  padding-top: 36px;
}

.chord-editor .delete-btn-small {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.6;
}

.chord-editor .delete-btn-small:hover {
  opacity: 1;
}

.chord-input {
  width: 120px;
  padding: 8px;
  font-size: 16px;
  font-family: monospace;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.chord-input:focus {
  outline: none;
  border-color: #4caf50;
}

.input-with-help {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #1976d2;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.help-btn:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.help-btn .material-icons {
  font-size: 20px;
}

.error-text {
  display: block;
  margin-top: 4px;
  color: #f44336;
  font-size: 12px;
  font-weight: bold;
}

.radio-group {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.radio-option:hover {
  background-color: #f5f5f5;
  border-color: #4caf50;
}

.radio-option input[type="radio"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.radio-option input[type="radio"]:checked + span {
  font-weight: bold;
  color: #4caf50;
}

.duration-radio-group {
  flex-direction: column;
  gap: 8px;
}

.duration-radio-group .radio-option {
  padding: 4px 8px;
  font-size: 14px;
}
</style>
