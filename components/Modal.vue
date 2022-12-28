<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
const { modal, props, options, isOpen, closeModal } = useModal();
const modalBoxRef = ref(null);

onClickOutside(modalBoxRef, () => {
  options.value.clickToClose && closeModal();
});

</script>

<template>
    <component v-if="options.raw" :is="modal" v-bind="props" />
    <TransitionRoot v-else as="template" :show="isOpen">
      <teleport to="body">
        <div class="fixed inset-0 z-40 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
              leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
              <div class="fixed inset-0 transition-opacity bg-slate-200/20 backdrop-filter backdrop-blur-[4px]"/>
            </TransitionChild>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <TransitionChild as="template" enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div
                :class="options.wrapperClass"
                class="inline-block w-full dark:bg-gray-950 bg-white rounded-7.5 my-auto text-left align-middle transition-all transform max-w-[460px]"
                role="dialog" aria-modal="true">
                  <div
                  ref="modalBoxRef"
                    :class="options.contentClass"
                    class="relative  md:px-[50px] px-6 py-8 md:py-10 w-full">
                    <button class="absolute h-7.5 w-7.5 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100 top-0 right-0 m-6" @click="closeModal" aria-label="Close modal">
                      <SVGX />
                    </button>

                    <component :is="modal" v-bind="props" />
                  </div>

                <CommonModalSnack />
              </div>
            </TransitionChild>
          </div>
        </div>
      </teleport>
    </TransitionRoot>
</template>
