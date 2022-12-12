import { DefineComponent } from "vue"

const modal = shallowRef<DefineComponent | null>(null)
const props = ref<any>({})

type Options = {
    raw: boolean,
    clickToClose: boolean
}

const options = ref<Options>({
    raw: false,
    clickToClose: true
})

const isOpen = ref(false)

const openModal = async (component: DefineComponent | any, componentProps: any = {}, modalOptions: Partial<Options> = {}) => {
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

    setTimeout(() => {
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