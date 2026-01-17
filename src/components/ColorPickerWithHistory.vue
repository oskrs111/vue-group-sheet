<template>
  <div class="color-picker-with-history">
    <input 
      type="color" 
      :value="modelValue" 
      @input="handleInput"
      @change="handleChange"
    />
    <div v-if="colorHistory.length > 0" class="color-history">
      <button
        v-for="(color, index) in colorHistory"
        :key="index"
        type="button"
        class="color-history-item"
        :style="{ backgroundColor: color }"
        :title="`Color reciente: ${color}`"
        @click="selectHistoryColor(color)"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { useColorHistory } from '../composables/useColorHistory'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const { colorHistory, addColor } = useColorHistory()

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleChange = (event) => {
  const color = event.target.value
  addColor(color)
  emit('update:modelValue', color)
}

const selectHistoryColor = (color) => {
  emit('update:modelValue', color)
  // Opcionalmente, mover el color al principio
  addColor(color)
}
</script>

<style scoped>
.color-picker-with-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-history {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-history-item {
  width: 30px;
  height: 30px;
  border: 2px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  background: none;
}

.color-history-item:hover {
  transform: scale(1.1);
  border-color: #1976d2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-history-item:active {
  transform: scale(0.95);
}
</style>
