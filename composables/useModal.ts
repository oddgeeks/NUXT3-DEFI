import { DefineComponent } from "vue"

const modal = shallowRef<DefineComponent | null>(null)
const props = ref<any>({})

type Options = {
    raw: boolean,
    clickToClose: boolean,
    wrapperClass: string,
    contentClass: string
}

const defaultOptions = () => ({
    raw: false,
    clickToClose: true,
    wrapperClass: '',
    contentClass: ''
} as Options)

const options = ref<Options>(defaultOptions())

const isOpen = ref(false)

let timeout: any;

const openModal = async (component: DefineComponent | any, componentProps: any = {}, modalOptions: Partial<Options> = {}) => {
    timeout && clearTimeout(timeout)

    if (modal.value) {
        modal.value = null
        await nextTick()
    }

    props.value = componentProps;
    modal.value = markRaw(component);
    options.value = Object.assign({}, options.value, modalOptions);
    isOpen.value = true
}

const closeModal = async () => {
    isOpen.value = false
    options.value = defaultOptions()

   timeout = setTimeout(() => {
        modal.value = null
        props.value = null
    }, 1000)
}

export function useModal() {
    return {
        modal: readonly(modal),
        props: readonly(props),
        options: readonly(options),
        isOpen: readonly(isOpen),
        closeModal,
        openModal
    }
}