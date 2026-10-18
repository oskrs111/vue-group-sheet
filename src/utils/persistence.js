import { ref } from 'vue'

const revision = ref(0)

export function getStorageItem(key) {
  void revision.value
  return window.electronAPI?.storage
    ? window.electronAPI.storage.getItem(key)
    : localStorage.getItem(key)
}

export function setStorageItem(key, value) {
  if (window.electronAPI?.storage) window.electronAPI.storage.setItem(key, value)
  else localStorage.setItem(key, value)
  revision.value++
}

export function importDesktopDatabase(database, merge) {
  if (!window.electronAPI?.importDatabase) return false
  window.electronAPI.importDatabase(JSON.stringify(database), merge)
  revision.value++
  return true
}

export function refreshDesktopStorage() {
  window.electronAPI?.refreshWorkspace?.()
  revision.value++
}

export async function refreshDesktopStorageAsync() {
  if (!window.electronAPI?.refreshWorkspaceAsync) return refreshDesktopStorage()
  await window.electronAPI.refreshWorkspaceAsync()
  revision.value++
}
