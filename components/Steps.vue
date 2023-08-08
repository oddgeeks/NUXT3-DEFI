<script setup lang="ts">
defineProps<{
  totalSteps: number
  currentStep: number
}>()
</script>

<template>
  <ul class="flex gap-4 justify-between">
    <li v-for="i in totalSteps" :key="i" :class="i <= currentStep ? 'bg-primary' : 'dark:bg-slate-700 bg-slate-150'" class="h-1.5 rounded-5 flex-1">
      <span class="sr-only">
        {{ i }}
      </span>
    </li>
  </ul>
</template>
