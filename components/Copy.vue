<script setup lang="ts">
import CopySVG from '~/assets/images/icons/copy.svg?component'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'

defineProps<{
  text: string
  iconOnly?: boolean
  successText?: string
}>()
const { copy, copied } = useClipboard()
const slots = useSlots()
</script>

<template>
  <button
    class="text-slate-400 font-semibold inline-flex items-center gap-2.5"
    @click.stop="copy(text)"
  >
    <Transition mode="out-in" name="slide-left">
      <span v-if="copied && !iconOnly"> {{ successText || 'Copied' }}  </span>
      <span v-else-if="slots.content">
        <slot name="content" />
      </span>
    </Transition>

    <Transition mode="out-in" name="slide">
      <CheckCircle
        v-if="copied"
        class="w-4 h-4 shrink-0 dark:text-slate-900 text-white svg-circle"
      />
      <slot v-else-if="slots.copy" name="copy" />
      <slot v-else name="copy-icon">
        <CopySVG />
      </slot>
    </Transition>
  </button>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.1s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.1s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
