<script setup lang="ts">
defineProps<{
  address: string
}>()

const randomId = Math.random().toString(36).substr(2, 9)
</script>

<template>
  <svg
    :style="{
      color: generateColor(address),
    }" width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30"
  >
    <g fill="currentColor" :clip-path="`url(#${randomId})`">
      <rect width="30" height="30" fill-opacity=".4" rx="15" />
      <ellipse cx="15.004" cy="26.399" rx="11.4" ry="6.6" />
      <circle cx="15" cy="12.75" r="5.4" />
    </g>
    <defs>
      <clipPath :id="randomId">
        <rect width="30" height="30" fill="#fff" rx="15" />
      </clipPath>
    </defs>
  </svg>
</template>
