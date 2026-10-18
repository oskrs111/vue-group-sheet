<template>
  <div v-dialog v-if="modelValue" class="modal-overlay confirm-overlay" @click.self="onCancel">
    <div class="modal-content confirm-content" :class="{ 'has-alternative': alternativeText }">
      <div class="modal-header">
        {{ title }}
      </div>
      <div class="modal-body">
        <p class="confirm-message">{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="secondary" @click="onCancel">{{ cancelText }}</button>
        <button v-if="alternativeText" type="button" class="secondary" :class="{ 'alternative-danger': alternativeDanger }" @click="onAlternative">{{ alternativeText }}</button>
        <button 
          type="button"
          class="primary" :class="{ 'danger-btn': isDanger }"
          @click="onConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: 'Confirmar'
  },
  message: String,
  confirmText: {
    type: String,
    default: 'Continuar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  alternativeText: String,
  alternativeDanger: Boolean,
  isDanger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'alternative', 'cancel'])

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const onAlternative = () => {
  emit('alternative')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.confirm-overlay {
  z-index: 10001; /* Above toasts and other modals */
}

.confirm-content {
  max-width: 400px;
}
.confirm-content.has-alternative { max-width: 560px; }
.confirm-message { white-space: pre-line; overflow-wrap: anywhere; line-height: 1.6; }
.confirm-content .modal-footer { flex-wrap: wrap; }
.confirm-content .modal-footer button.alternative-danger { color: var(--ms-danger); border-color: var(--ms-danger); }
.confirm-content .modal-footer button.alternative-danger:hover { background: var(--ms-danger-soft); }

.danger-btn {
  background: var(--ui-danger) !important;
  box-shadow: none;
}

.danger-btn:hover {
  background: var(--ui-danger-hover) !important;
}
</style>
