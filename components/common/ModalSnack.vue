<script setup lang="ts">
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg?component'
import SVGErrorCircle from '~/assets/images/icons/error-circle.svg?component'

withDefaults(defineProps<{
  open?: boolean
  type?: 'success' | 'error' | 'info'
  message?: string
}>(), {
  open: false,
  type: 'success',
  message: '',
})

const colors = {
  success: 'bg-green-400 text-white ',
  error: 'bg-red-alert text-white ',
  info: 'dark:bg-slate-750 bg-slate-150 dark:text-white text-slate-900',
}
</script>

<template>
  <Transition mode="out-in" name="slide-up">
    <div
      v-if="open"
      :class="colors[type]"
      class="absolute bottom-0 px-5 font-medium rounded-b-7.5 min-h-[48px] flex-col w-full items-center justify-center flex gap-2 py-2"
    >
      <p
        style="word-break: break-word"
        class="text-xs flex gap-2 max-h-20 overflow-auto"
      >
        <SvgoInfo2 v-if="type === 'info'" class="h-4 w-4 shrink-0 text-slate-400" />
        <SVGErrorCircle
          v-else-if="type === 'error'"
          class="h-4 w-4 shrink-0 [&>rect]:fill-white [&>path]:stroke-red-alert"
        />
        <SVGCheckCircle
          v-else
          class="h-4 w-4 shrink-0 [&>rect]:fill-white [&>path]:stroke-green-400"
        />

        {{ message }}
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(0);
}
</style>
