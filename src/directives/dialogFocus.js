let dialogSequence = 0
const focusable = element => [...element.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])')]
  .filter(item => !item.disabled && item.getClientRects().length)

export const dialogFocus = {
  mounted(element, binding) {
    if (binding.value === false) return
    const previous = document.activeElement
    const id = `editor-dialog-${++dialogSequence}`
    const heading = element.querySelector('.modal-header, h2')
    element.setAttribute('role', 'dialog')
    element.setAttribute('aria-modal', 'true')
    element.tabIndex = -1
    if (heading) {
      heading.id ||= id
      element.setAttribute('aria-labelledby', heading.id)
    }
    element.querySelectorAll('.form-group').forEach((group, index) => {
      const label = group.querySelector('label')
      const input = group.querySelector('input, textarea, select')
      if (label && input && !input.labels?.length && !input.hasAttribute('aria-label')) {
        input.id ||= `${id}-field-${index}`
        label.htmlFor = input.id
      }
    })
    const onKeydown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (typeof binding.value === 'function') binding.value()
        else element.click()
      } else if (event.key === 'Tab') {
        const items = focusable(element)
        const first = items[0] || element
        const last = items.at(-1) || element
        if (!items.length || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        }
      }
    }
    element.addEventListener('keydown', onKeydown)
    element._dialogCleanup = () => {
      element.removeEventListener('keydown', onKeydown)
      if (previous?.isConnected) previous.focus()
      else {
        const remainingDialog = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
          .filter(dialog => dialog !== element && dialog.getClientRects().length).at(-1)
        if (remainingDialog) (focusable(remainingDialog)[0] || remainingDialog).focus()
      }
    }
    queueMicrotask(() => {
      if (element.isConnected) (focusable(element)[0] || element).focus()
    })
  },
  updated(element, binding) {
    if (binding.value === false && binding.oldValue !== false) {
      element._dialogCleanup?.()
      element._dialogCleanup = null
      element.removeAttribute('aria-modal')
      element.removeAttribute('role')
      element.removeAttribute('tabindex')
    } else if (binding.value !== false && binding.oldValue === false) {
      dialogFocus.mounted(element, binding)
    }
  },
  unmounted(element) { element._dialogCleanup?.() }
}
