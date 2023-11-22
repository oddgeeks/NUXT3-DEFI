<script setup lang="ts">
defineProps<{
  totalSteps: number
  currentStep: number
}>()
</script>

<template>
  <ul class="flex justify-between gap-4">
    <li v-for="i in totalSteps" :key="i" :class="i <= currentStep ? 'bg-primary' : 'bg-slate-700 '" class="h-1.5 flex-1 rounded-5">
      <span class="sr-only">
        {{ i }}
      </span>
    </li>
  </ul>
</template>
