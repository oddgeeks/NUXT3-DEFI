<script setup lang="ts">
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import SVGErrorCircle from  "~/assets/images/icons/error-circle.svg?component";

const { props, closeModal } = useModal();
</script>

<template>
    <div
      class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
    >
      <SVGCheckCircle
        class="text-white success"
        v-if="props.type === 'success'"
      />
      <SVGErrorCircle  v-if="props.type === 'error'" />

      <div class="flex flex-col gap-[15px]">
        <h1 class="text-lg">{{ props.title }}</h1>

        <p class="text-slate-400 text-xs text-center leading-5">
          {{ props.content }}
        </p>
      </div>
      <CommonButton
        @click="closeModal()"
        class="w-full justify-center"
        size="lg"
      >
        Okay
      </CommonButton>
    </div>
</template>

<style scoped>
.success :deep(path):first-child {
  @apply fill-green-400 stroke-green-400;
}
</style>
