<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";

const emit = defineEmits(["destroy", "reject"]);

const { lastModal } = useModal();

const { escape } = useMagicKeys();

const props = withDefaults(
  defineProps<{
    show?: boolean;
    modalId?: string;
    options?: any;
    inline?: boolean;
    isAsync?: boolean;
  }>(),
  {
    modalId: "",
    show: false,
    isAsync: false,
    inline: false,
    options: {},
  }
);

const wrapperRef = ref<HTMLElement>();

const handleDestory = () => {
  emit("destroy");

  if (props.isAsync) {
    emit("reject");
  }
};

onClickOutside(
  wrapperRef,
  (event: any) => {
    if (event.currentTarget) {
      const targetModalId = event.target?.dataset?.modalId;

      if (targetModalId === props.modalId) {
        handleDestory();
      }
    }
  },
  {
    ignore: [".modal-content-wrapper"],
  }
);

whenever(escape, () => {
  if (props.inline && props.show) {
    handleDestory();
  } else if (props.show && lastModal.value.id === props.modalId) {
    handleDestory();
  }
});
</script>

<template>
  <div
    :data-modal-id="modalId"
    class="fixed modal inset-0 z-50 overflow-y-auto bg-slate-200/20 backdrop-filter backdrop-blur-[4px]"
  >
    <div
      :data-modal-id="modalId"
      class="flex sm:items-center justify-center h-full sm:min-h-screen text-center sm:p-0"
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
        class="inline-block relative modal-inner w-full sm:my-6 dark:bg-gray-950 bg-white sm:rounded-7.5 text-left align-middle max-w-[460px]"
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
          class="modal-content-wrapper rounded-[inherit] relative sm:px-[50px] px-6 sm:py-10 w-full"
        >
          <button
            @touchmove.passive="handleDestory"
            @mousedown="handleDestory"
            type="button"
            v-if="options.sheetPosition === 'bottom'"
            class="w-full justify-center h-9 flex sm:hidden"
          >
            <div
              class="h-1 w-9 dark:bg-slate-600 rounded-[10px] mt-2 bg-slate-300"
            >
              <span class="sr-only"> Pull to close </span>
            </div>
          </button>
          <button
            class="absolute h-7.5 w-7.5 rounded-full items-center justify-center hidden sm:flex dark:bg-slate-800 bg-slate-100 top-0 right-0 m-6"
            @click="handleDestory"
            aria-label="Close modal"
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
