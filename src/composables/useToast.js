import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    const id = ++toastId
    toasts.value.push({ id, message, type, duration, visible: true })
    setTimeout(() => {
      dismiss(id)
    }, duration)
    return id
  }

  function success(message, duration = 3000) {
    return show(message, 'success', duration)
  }

  function error(message, duration = 4000) {
    return show(message, 'error', duration)
  }

  function info(message, duration = 3000) {
    return show(message, 'info', duration)
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, show, success, error, info, dismiss }
}
