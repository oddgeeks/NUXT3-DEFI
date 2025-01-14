<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    show?: boolean
    modalId?: string
    options: IOptions
    inline?: boolean
    isAsync?: boolean
  }>(),
  {
    modalId: '',
    show: false,
    isAsync: false,
    inline: false,
  },
)

const emit = defineEmits(['destroy', 'reject'])

const modalOptions = computed(() => props.options || {})

const { lastModal } = useModal()

const { escape } = useMagicKeys()

const wrapperRef = ref<HTMLElement>()

function handleDestory() {
  emit('destroy')

  if (props.isAsync)
    emit('reject')
}

onClickOutside(
  wrapperRef,
  (event: any) => {
    if (event.currentTarget) {
      if (!modalOptions.value.clickToClose)
        return

      const targetModalId = event.target?.dataset?.modalId

      if (targetModalId === props.modalId)
        handleDestory()
    }
  },
  {
    ignore: ['.modal-content-wrapper'],
  },
)

whenever(escape, () => {
  if (!modalOptions.value.clickToClose)
    return

  if (props.inline && props.show)
    handleDestory()
  else if (props.show && lastModal.value.id === props.modalId)
    handleDestory()
})
</script>

<template>
  <div :data-modal-id="modalId" class="modal fixed inset-0 z-50 overflow-y-auto bg-slate-200/20 backdrop-blur-[4px]">
    <div
      :data-modal-id="modalId"
      class="modal-height-wrapper flex h-full justify-center pt-20 text-center sm:h-auto sm:min-h-screen sm:items-center sm:p-0"
    >
      <div
        :class="[
          {
            'mt-auto rounded-t-7.5': modalOptions.sheetPosition === 'bottom' || !modalOptions.sheetPosition,
            'mb-auto rounded-b-7.5': modalOptions.sheetPosition === 'top',
          },
          modalOptions.wrapperClass,
        ]"
        :data-sheet-position="modalOptions.sheetPosition"
        class="modal-inner relative inline-block w-full max-w-[460px]  bg-gray-975 text-left align-middle sm:my-6 sm:rounded-7.5"
        role="dialog"
        aria-modal="true"
      >
        <div
          ref="wrapperRef" :class="[
            {
              'pb-8': modalOptions.sheetPosition === 'bottom',
              'py-8': modalOptions.sheetPosition === 'top',
            },
            modalOptions.contentClass,
          ]"
          class="modal-content-wrapper relative w-full rounded-[inherit] p-5 sm:p-7.5"
        >
          <button
            v-if="modalOptions.closeButton"
            class="absolute right-0 top-0 z-[1] m-5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-gray-800 sm:m-6"
            aria-label="Close modal" @click="handleDestory"
          >
            <SvgoX />
          </button>
          <slot />
        </div>
        <CommonModalSnack v-bind="modalOptions.snackOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.backrop-animation {
  animation: backdrop-animation 200ms ease-out;
}

@keyframes backdrop-animation {
  0% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>
