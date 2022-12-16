<script setup lang="ts">
const { modal, props, options, isOpen, closeModal } = useModal();
const modalBoxRef = ref(null);

onClickOutside(modalBoxRef, () => {
  options.value.clickToClose && closeModal();
});

</script>

<template>
  <teleport to="body">
    <component v-if="options.raw" :is="modal" v-bind="props" />

    <TransitionRoot v-else as="template" :show="isOpen">
      <teleport to="body">
        <div class="fixed inset-0 z-40 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
              leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
              <div class="fixed inset-0 transition-opacity bg-slate-200/20 backdrop-filter backdrop-blur-[4px]" @click="closeModal"/>
            </TransitionChild>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <TransitionChild as="template" enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div
                :class="options.wrapperClass"
                class="inline-block w-full my-auto text-left align-middle transition-all transform shadow max-w-[460px]"
                role="dialog" aria-modal="true">
                <div ref="target">
                  <div
                    :class="options.contentClass"
                    class="relative bg-[#111827] rounded-5 px-[50px] py-10 w-full">
                    <button class="absolute top-0 right-0 m-6" @click="closeModal" aria-label="Close modal">
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="30" height="30" rx="15" fill="#1E293B" />
                        <path d="M18.5 11.5L11.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round" />
                        <path d="M11.5 11.5L18.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round" />
                      </svg>
                    </button>

                    <div>
                      <component :is="modal" v-bind="props" />
                    </div>
                  </div>
                </div>
              </div>
            </TransitionChild>
          </div>
        </div>
      </teleport>
    </TransitionRoot>
  </teleport>
</template>
