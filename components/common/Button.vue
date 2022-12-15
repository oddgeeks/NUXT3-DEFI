<script setup lang="ts">
defineProps({
  color: {
    type: String,
    default: "blue",
    validator: (value: string) => ["blue"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value: string) => ["md", "lg"].includes(value),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <button
    type="button"
    :class="[
      {
        'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500':
          color === 'blue',
      },
      {
        'text-sm py-2 px-5.5 rounded-5': size === 'md',
      },
      {
        'text-sm py-3 px-5.5 rounded-10': size === 'lg',
      },
    ]"
    class="font-semibold inline-flex disabled:pointer-events-none disabled:select-none"
    :disabled="loading"
  >
    <slot v-if="!loading" />
    <div v-else class="dot-flashing my-1.5"></div>
  </button>
</template>

<style scoped>
.dot-flashing {
  @apply relative w-2 h-2 rounded-full bg-white text-white;
  animation: dot-flashing 1s infinite linear alternate;
  animation-delay: 0.5s;
}
.dot-flashing::before,
.dot-flashing::after {
  content: "";
  @apply inline-block absolute top-0;
}
.dot-flashing::before {
  @apply w-2 h-2 rounded-full bg-white text-white;
  left: -13px;
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 0s;
}
.dot-flashing::after {
  @apply w-2 h-2 rounded-full bg-white text-white;
  left: 13px;
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 1s;
}

@keyframes dot-flashing {
  0% {
    background-color: rgba(255, 255, 255, 1);
  }
  50%,
  100% {
    background-color: rgba(255, 255, 255, 0.3);
  }
}
</style>
