import { ref } from 'vue'

export function useConfirmDialog() {
  const confirmState = ref({ show: false })
  let dialogId = 0

  const showConfirm = options => {
    confirmState.value = {
      title: 'Confirmar',
      message: '',
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
      alternativeText: '',
      alternativeDanger: false,
      isDanger: false,
      onConfirm: () => {},
      onAlternative: () => {},
      onCancel: () => {},
      ...options,
      id: ++dialogId,
      show: true
    }
  }

  // true: primary action; false: explicit alternative; null: cancel, Escape or backdrop.
  const askConfirm = options => new Promise(resolve => {
    showConfirm({
      ...options,
      onConfirm: () => resolve(true),
      onAlternative: () => resolve(false),
      onCancel: () => resolve(null)
    })
  })

  return { confirmState, showConfirm, askConfirm }
}
