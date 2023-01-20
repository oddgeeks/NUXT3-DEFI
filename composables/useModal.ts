const modals = ref<IModal[]>([]);
const lastModal = computed(() => modals.value[modals.value.length - 1]);

const defaultOptions = () =>
  ({
    raw: false,
    clickToClose: true,
    wrapperClass: "",
    contentClass: "",
    snackOptions: {
      open: false,
      type: "success",
      message: "",
      timeout: 6000,
    },
  } as IOptions);

export function openSnackbar({
  message,
  timeout = 6000,
  type = "success",
}: ISnackOptions) {
  const modal = modals.value.find((m) => m.id === lastModal.value?.id);

  if (!modal) throw new Error("No modal found");

  modal.options = {
    ...modal.options,
    snackOptions: {
      open: true,
      message,
      timeout,
      type,
    },
  };

  setTimeout(() => {
    modal.options = {
      ...modal.options,
      snackOptions: defaultOptions().snackOptions,
    };
  }, timeout);
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
  modal: IModal;
  success: boolean;
  payload: any;
}> {
  const id = Math.random().toString(36).substr(2, 9);

  const destroy = () => {
    modals.value = modals.value.filter((m) => m.id !== id);
  };

  const mergedOptions = Object.assign({}, defaultOptions(), options);

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
  };

  modals.value.push(modal);

  if (!modal.async)
    return {
      modal,
      success: true,
      payload: null,
    };

  return new Promise((resolve, reject) => {
    modal.onResolve = async (success: boolean, payload) => {
      destroy();
      resolve({
        modal,
        success,
        payload,
      });
    };

    modal.onReject = async (success: boolean, payload) => {
      destroy();
      resolve({
        modal,
        success,
        payload,
      });
    };
  });
}

export function useModal() {
  return {
    modals: readonly(modals),
    openSnackbar,
    openModal,
  };
}
