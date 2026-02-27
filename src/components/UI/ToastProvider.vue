<template>
  <div class="toast-provider">
    <TransitionGroup name="toast-list">
      <NotificationToast
        v-for="toast in store.toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        @close="store.removeToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../../stores/notificationStore'
import NotificationToast from './NotificationToast.vue'

const store = useNotificationStore()
</script>

<style scoped>
.toast-provider {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.toast-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-list-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
