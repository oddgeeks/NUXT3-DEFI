<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const props = withDefaults(
  defineProps<{
    show?: boolean
    modalId?: string
    options?: any
    inline?: boolean
    isAsync?: boolean
  }>(),
  {
    modalId: '',
    show: false,
    isAsync: false,
    inline: false,
    options: {},
  },
)

const emit = defineEmits(['destroy', 'reject'])

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
  if (props.inline && props.show)
    handleDestory()
  else if (props.show && lastModal.value.id === props.modalId)
    handleDestory()
})
</script>

<template>
  <div
    :data-modal-id="modalId"
    class="modal fixed inset-0 z-50 overflow-y-auto bg-slate-200/20 backdrop-blur-[4px]"
  >
    <div
      :data-modal-id="modalId"
      class="modal-height-wrapper flex h-full justify-center text-center sm:h-auto sm:min-h-screen sm:items-center sm:p-0"
    >
      <div
        :class="[
          {
            'mt-auto rounded-t-7.5': options.sheetPosition === 'bottom',
            'mb-auto rounded-b-7.5': options.sheetPosition === 'top',
          },
          options.wrapperClass,
        ]"
        :data-sheet-position="options.sheetPosition"
        class="modal-inner relative inline-block w-full max-w-[460px] bg-white text-left align-middle dark:bg-gray-950 sm:my-6 sm:rounded-7.5"
        role="dialog"
        aria-modal="true"
      >
        <div
          ref="wrapperRef"
          :class="[
            {
              'pb-8': options.sheetPosition === 'bottom',
              'py-8': options.sheetPosition === 'top',
            },
            options.contentClass,
          ]"
          class="modal-content-wrapper relative w-full rounded-[inherit] px-6 py-10 sm:px-[50px]"
        >
          <button
            class="absolute right-0 top-0 m-6 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            aria-label="Close modal"
            @click="handleDestory"
          >
            <SVGX />
          </button>
          <slot />
        </div>
        <CommonModalSnack v-bind="options.snackOptions" />
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
