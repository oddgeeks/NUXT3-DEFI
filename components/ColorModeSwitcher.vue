<script lang="ts" setup>
import Sun from "~/assets/images/icons/sun.svg?component";
import Moon from "~/assets/images/icons/moon.svg?component";
import { ColorModeInstance } from "@nuxtjs/color-mode/dist/runtime/types";

const switchColorMode = (colorMode: ColorModeInstance) => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <ColorScheme>
    <button
      class="inline-flex items-center justify-center w-9 h-9"
      @click="switchColorMode($colorMode)"
    >
      <Transition name="slide-up">
        <span class="absolute" v-if="$colorMode.value === 'dark'">
          <Sun />
        </span>
        <span v-else class="absolute">
          <Moon />
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
