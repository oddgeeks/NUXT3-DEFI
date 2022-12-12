<script setup lang="ts">
const show = ref(false);
let el = shallowRef<HTMLElement|null>(null);
let isLocked = ref(false);

const { isRevealed, reveal, cancel } = useConfirmDialog(show);

defineProps({
  containerClass: {
    type: String,
    default: null,
  },
  backdropClass: {
    type: String,
    default: null,
  },
});

if (process.client) {
  el.value = window.document.body;
  isLocked = useScrollLock(el);
}

watch(isRevealed, () => {
  isLocked.value = !isLocked.value;
});

// on click outside logic
const target = ref(null);
onClickOutside(target, () => {
  cancel();
});

defineExpose({
  reveal,
  cancel,
});
</script>

<template>
  <slot :openModal="reveal" name="reveal" />
  <TransitionRoot as="template" :show="isRevealed">
    <teleport to="body">
      <div class="fixed inset-0 z-40 overflow-y-auto">
        <div
          class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div
              class="fixed inset-0 transition-opacity bg-slate-200/20 backdrop-filter backdrop-blur-[4px]"
              :class="backdropClass"
            />
          </TransitionChild>
          <span
            class="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
            >&#8203;</span
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
              class="inline-block w-full my-auto text-left align-middle transition-all transform shadow-xl sm:max-w-sm md:max-w-lg"
              :class="containerClass"
              role="dialog"
              aria-modal="true"
            >
              <div ref="target">
                <slot :closeModal="cancel" />
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </teleport>
  </TransitionRoot>
</template>
