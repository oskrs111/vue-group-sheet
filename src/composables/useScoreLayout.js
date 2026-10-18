import { onMounted, onBeforeUnmount, watch } from 'vue'
import { layoutScoreGrids } from '../utils/scoreLayout'

export function useScoreLayout(root, source) {
  let observer
  const update = () => {
    if (root.value?.isConnected) layoutScoreGrids(root.value)
  }
  const observeContent = () => {
    if (!observer || !root.value) return
    observer.disconnect()
    observer.observe(root.value)
    observer.observe(root.value.querySelector('.score-compass-grid'))
    root.value.querySelectorAll('.chords-display, .repeat-symbol').forEach(element => observer.observe(element))
  }
  watch(source, () => {
    observeContent()
    update()
  }, { deep: true, flush: 'post' })
  onMounted(() => {
    observer = new ResizeObserver(update)
    // Font and intrinsic content sizes can change without changing the grid's width.
    observeContent()
    update()
    document.fonts?.ready.then(update)
    document.fonts?.addEventListener('loadingdone', update)
    window.addEventListener('beforeprint', update)
    window.addEventListener('afterprint', update)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.fonts?.removeEventListener('loadingdone', update)
    window.removeEventListener('beforeprint', update)
    window.removeEventListener('afterprint', update)
  })
}
