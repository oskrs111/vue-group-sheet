<template>
  <div v-if="modelValue" class="modal-overlay confirm-overlay" @click.self="onCancel">
    <div class="modal-content confirm-content">
      <div class="modal-header">
        {{ title }}
      </div>
      <div class="modal-body">
        <p v-html="message"></p>
      </div>
      <div class="modal-footer">
        <button class="secondary" @click="onCancel">{{ cancelText }}</button>
        <button 
          :class="confirmClass" 
          @click="onConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: 'Confirmar'
  },
  message: String,
  confirmText: {
    type: String,
    default: 'Aceptar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  isDanger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const confirmClass = props.isDanger ? 'primary danger-btn' : 'primary'
</script>

<style scoped>
.confirm-overlay {
  z-index: 10001; /* Above toasts and other modals */
}

.confirm-content {
  max-width: 400px;
}

.danger-btn {
  background: var(--ui-danger) !important;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3) !important;
}

.danger-btn:hover {
  background: var(--ui-danger-hover) !important;
}
</style>
