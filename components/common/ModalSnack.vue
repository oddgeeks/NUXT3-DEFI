<script setup lang="ts">
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import SVGErrorCircle from "~/assets/images/icons/error-circle.svg?component";
const { options } = useModal();
</script>

<template>
  <Transition mode="out-in" name="slide-up">
    <div
      v-if="options.snackOptions.open"
      :class="
        options.snackOptions.type === 'error' ? 'bg-red-alert' : 'bg-green-400'
      "
      class="absolute bottom-0 px-5 text-white rounded-b-7.5 min-h-[48px] flex-col w-full items-center justify-center flex gap-2 py-2"
    >
      <p
        style="word-break: break-word"
        class="text-xs flex gap-2 max-h-20 overflow-auto capitalize"
      >
        <SVGErrorCircle
          v-if="options.snackOptions.type === 'error'"
          class="h-4 w-4 [&>rect]:fill-white [&>path]:stroke-red-alert"
        />
        <SVGCheckCircle
          v-else
          class="h-4 w-4 [&>rect]:fill-white [&>path]:stroke-green-400"
        />
        {{ options.snackOptions.message }}
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
