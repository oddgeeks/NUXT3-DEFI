<script setup lang="ts">
const checked = defineModel()
</script>

<template>
  <label class="flex cursor-pointer items-center gap-2 text-gray-400" for="input-check">
    <input id="input-check" v-model="checked" class="peer sr-only" type="checkbox">
    <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle h-[21.8px] w-[21.8px] shrink-0 cursor-pointer text-gray-500" />
    <span class="peer-checked:text-white">
      <slot name="label" />
    </span>
  </label>
</template>
