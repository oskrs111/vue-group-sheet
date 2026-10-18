import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { useNotificationStore } from './stores/notificationStore'
import AppIcon from './components/UI/AppIcon.vue'
import { dialogFocus } from './directives/dialogFocus'
import './styles/workspace.css'
import { registerLocalChordFont } from './utils/localChordFont'

registerLocalChordFont()
const app = createApp(App)
app.use(createPinia())
app.component('AppIcon', AppIcon)
app.directive('dialog', dialogFocus)
window.electronAPI?.onStorageError(message => {
  useNotificationStore().addToast('Error de almacenamiento: ' + message, 'error', 10000)
})
app.mount('#app')
