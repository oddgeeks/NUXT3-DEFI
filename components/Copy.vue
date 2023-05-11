<script setup lang="ts">
import CopySVG from '~/assets/images/icons/copy.svg'
import CheckCircle from '~/assets/images/icons/check-circle.svg'

defineProps<{
  text: string
  iconOnly?: boolean
}>()
const { copy, copied } = useClipboard()
const slots = useSlots()
</script>

<template>
  <button
    class="text-slate-400 font-semibold inline-flex items-center gap-2.5"
    @click="copy(text)"
  >
    <Transition mode="out-in" name="slide-left">
      <span v-if="copied && !iconOnly"> Copied </span>
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
      <CopySVG v-else />
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
