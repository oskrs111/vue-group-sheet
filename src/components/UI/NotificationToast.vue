<template>
  <div 
    class="notification-toast" 
    :class="type"
    @click="$emit('close')"
  >
    <div class="toast-icon">
      <span class="material-icons">{{ icon }}</span>
    </div>
    <div class="toast-content">
      {{ message }}
    </div>
    <button class="toast-close">
      <span class="material-icons">close</span>
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
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.notification-toast:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon .material-icons {
  font-size: 20px;
}

.success .toast-icon { color: #10b981; }
.error .toast-icon { color: var(--ui-danger); }
.warning .toast-icon { color: #f59e0b; }
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
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 0;
  display: flex;
}

.toast-close .material-icons {
  font-size: 18px;
}

.toast-close:hover {
  color: white;
}
</style>
