import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        toasts: []
    }),
    actions: {
        addToast(message, type = 'info', duration = 3000) {
            const id = Date.now() + Math.random()
            this.toasts.push({
                id,
                message,
                type, // 'success', 'error', 'info', 'warning'
                duration
            })

            if (duration > 0) {
                setTimeout(() => {
                    this.removeToast(id)
                }, duration)
            }
            return id
        },
        removeToast(id) {
            const index = this.toasts.findIndex(t => t.id === id)
            if (index !== -1) {
                this.toasts.splice(index, 1)
            }
        }
    }
})
