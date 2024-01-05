export interface Notifications {
  id: string
  duration: number
  icon?: any
  position:
    | 'center'
    | 'top-center'
    | 'top-start'
    | 'top-end'
    | 'bottom-center'
    | 'bottom-start'
    | 'bottom-end'
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  as?: any
  onClick?: () => void
}

const notifications = ref<Notifications[]>([])

const positionedNotifications = computed(() =>
  groupBy(notifications.value, v => v.position),
)

export function notify({
  position = 'bottom-end',
  type = 'success',
  duration = 6000,
  message = '',
  title = '',
  icon,
  as,
  onClick,
}: Partial<Notifications>) {
  const id = `notification-${performance.now()}`

  notifications.value.push({
    as,
    onClick,
    duration,
    id,
    message,
    position,
    title,
    type,
    icon,
  })
}

export function useNotification() {
  const deleteItem = (id: string, timeout?: number) => {
    setTimeout(() => {
      notifications.value = notifications.value.filter(v => v.id !== id)
    }, timeout)
  }

  onMounted(() => {
    // @ts-expect-error
    window.notify = notify
  })

  return {
    notifications,
    positionedNotifications,
    deleteItem,
    notify,
  }
}
