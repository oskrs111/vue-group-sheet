<template>
  <div 
    class="notification-toast" 
    :class="type"
    :role="type === 'error' ? 'alert' : 'status'"
  >
    <div class="toast-icon">
      <AppIcon :name="icon" />
    </div>
    <div class="toast-content">
      {{ message }}
    </div>
    <button class="toast-close" aria-label="Cerrar notificación" @click="$emit('close')">
      <AppIcon name="close" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'info'
  }
})

defineEmits(['close'])

const icon = computed(() => {
  switch (props.type) {
    case 'success': return 'check_circle'
    case 'error': return 'error'
    case 'warning': return 'warning'
    default: return 'info'
  }
})
</script>

<style scoped>
.notification-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  min-width: 300px;
  max-width: 450px;
  background: var(--ms-surface);
  border: 1px solid var(--ms-border);
  border-radius: var(--ms-radius-md);
  color: var(--ms-text);
  box-shadow: 0 4px 20px rgb(32 32 54 / 10%);
  pointer-events: auto;
  transition: border-color .15s;
}

.notification-toast:hover {
  border-color: var(--ms-accent);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon .material-icons {
  font-size: 20px;
}

.success .toast-icon { color: var(--ms-success); }
.error .toast-icon { color: var(--ui-danger); }
.warning .toast-icon { color: var(--ms-warning); }
.info .toast-icon { color: var(--ui-accent); }

.toast-content {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: var(--ms-text-muted);
  cursor: pointer;
  padding: 0;
  display: flex;
}

.toast-close .material-icons {
  font-size: 18px;
}

.toast-close:hover {
  color: var(--ms-accent);
}
</style>
