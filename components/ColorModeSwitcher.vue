<script lang="ts" setup>
import type { ColorModeInstance } from '@nuxtjs/color-mode/dist/runtime/types'
import Sun from '~/assets/images/icons/sun.svg?component'
import Moon from '~/assets/images/icons/moon.svg?component'

function switchColorMode(colorMode: ColorModeInstance) {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <ColorScheme>
    <button
      class="inline-flex items-center justify-center w-9 h-9 relative"
      @click="switchColorMode($colorMode)"
    >
      <Transition name="slide-up">
        <span v-if="$colorMode.value === 'dark'" class="absolute">
          <Sun class="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
        </span>
        <span v-else class="absolute">
          <Moon class="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
        </span>
      </Transition>
    </button>
  </ColorScheme>
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
  transform: translateY(-30px);
}
</style>
