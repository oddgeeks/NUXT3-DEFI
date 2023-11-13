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
  info: 'bg-slate-750 text-white',
}
</script>

<template>
  <Transition mode="out-in" name="slide-up">
    <div
      v-if="open"
      :class="colors[type]"
      class="absolute bottom-0 flex min-h-[48px] w-full flex-col items-center justify-center gap-2 rounded-b-7.5 px-5 py-2 font-medium"
    >
      <p
        style="word-break: break-word"
        class="flex max-h-20 gap-2 overflow-auto text-xs"
      >
        <SvgoInfo2 v-if="type === 'info'" class="h-4 w-4 shrink-0 text-gray-400" />
        <SVGErrorCircle
          v-else-if="type === 'error'"
          class="h-4 w-4 shrink-0 [&>path]:stroke-red-alert [&>rect]:fill-white"
        />
        <SVGCheckCircle
          v-else
          class="h-4 w-4 shrink-0 [&>path]:stroke-green-400 [&>rect]:fill-white"
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
