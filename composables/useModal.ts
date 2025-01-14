const modals = ref<IModal[]>([])
const lastModal = computed(
  () => modals.value[Math.max(0, modals.value.length - 1)],
)

function defaultOptions() {
  return {
    raw: false,
    clickToClose: true,
    closeButton: true,
    wrapperClass: '',
    contentClass: '',
    snackOptions: {
      open: false,
      type: 'success',
      message: '',
      timeout: 6000,
    },
  } as IOptions
}

export function openSnackbar({
  message,
  timeout = 6000,
  type = 'success',
}: ISnackOptions) {
  const modal = modals.value.find(m => m.id === lastModal.value?.id)

  if (!modal)
    throw new Error('No modal found')

  modal.options = {
    ...modal.options,
    snackOptions: {
      open: true,
      message,
      timeout,
      type,
    },
  }

  setTimeout(() => {
    modal.options = {
      ...modal.options,
      snackOptions: defaultOptions().snackOptions,
    }
  }, timeout)
}

async function openModal({
  component = null,
  componentProps = {},
  options = defaultOptions(),
  onReject = async () => {},
  onResolve = async () => {},
  async = false,
  ...params
}: Partial<IModal>): Promise<{
  modal: IModal
  success: boolean
  payload: any
}> {
  const id = params.id || Math.random().toString(36).substr(2, 9)

  const destroy = () => {
    modals.value = modals.value.filter(m => m.id !== id)

    if (!modals.value?.length)
      repositionScroll()
  }

  const mergedOptions = Object.assign({}, defaultOptions(), options)

  const modal: IModal = {
    id,
    component: markRaw(component),
    componentProps,
    destroy,
    onReject,
    onResolve,
    async,
    options: mergedOptions,
    ...params,
  }

  if (!modals.value.length)
    adjustScroll()

  modals.value.push(modal)

  if (!modal.async) {
    return {
      modal,
      success: true,
      payload: null,
    }
  }

  return new Promise((resolve, _reject) => {
    modal.onResolve = async (success = true, payload) => {
      destroy()
      resolve({
        modal,
        success,
        payload,
      })
    }

    modal.onReject = async (success: boolean, payload) => {
      destroy()
      resolve({
        modal,
        success,
        payload,
      })
    }
  })
}

function clearAllModals() {
  modals.value = []
  repositionScroll()
}

function adjustScroll() {
  const scrollBarWidth = window.innerWidth - document.body.clientWidth

  document.body.style.paddingRight = `${scrollBarWidth}px`
  document.body.classList.add('modal-open')
}

function repositionScroll() {
  document.body.classList.remove('modal-open')
  document.body.style.paddingRight = ''
}

export function useModal() {
  return {
    modals: readonly(modals),
    openSnackbar,
    openModal,
    lastModal,
    clearAllModals,
  }
}
