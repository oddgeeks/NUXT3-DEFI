<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";

const emit = defineEmits(["destroy", "reject"]);

const { lastModal } = useModal();

const { escape } = useMagicKeys();

const props = withDefaults(
  defineProps<{
    show?: boolean;
    id?: string;
    options?: any;
    inline?: boolean;
    async?: boolean;
  }>(),
  {
    id: "",
    show: false,
    async: false,
    inline: false,
    options: {},
  }
);

const wrapperRef = ref<HTMLElement>();

const handleDestory = () => {
  emit("destroy");

  if (props.async) {
    emit("reject");
  }
};

onClickOutside(wrapperRef, (event) => {
  if(event.currentTarget) {
    handleDestory()
  }

}, {
  ignore:['.modal-content-wrapper']
})

whenever(escape, () => {
  if (props.inline && props.show) {
    handleDestory();
  } else if (props.show && lastModal.value.id === props.id) {
    handleDestory();
  }
});
</script>

<template>
  <TransitionRoot appear as="template" :show="show">
    <div class="fixed modal backrop-animation inset-0 z-40 overflow-y-auto bg-slate-200/20 backdrop-filter backdrop-blur-[4px]">
      <div
        class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            :class="options.wrapperClass"
            class="inline-block w-full my-6 dark:bg-gray-950 bg-white rounded-7.5 text-left align-middle transition-all transform max-w-[460px]"
            role="dialog"
            aria-modal="true"
          >
            <div
              ref="wrapperRef"
              :class="options.contentClass"
              class="modal-content-wrapper relative md:px-[50px] px-6 py-8 md:py-10 w-full"
            >
              <button
                class="absolute h-7.5 w-7.5 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100 top-0 right-0 m-6"
                @click="handleDestory"
                aria-label="Close modal"
              >
                <SVGX />
              </button>
              <slot />
            </div>
            <CommonModalSnack v-bind="options.snackOptions" />
          </div>
        </TransitionChild>
      </div>
    </div>
  </TransitionRoot>
</template>

<style scoped>
.backrop-animation {
  animation: backdrop-animation 300ms ease-out;
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