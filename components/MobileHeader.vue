<script lang="ts" setup>
const { toggleHideSidebar } = useSidebar()
</script>

<template>
  <div
    class="fixed left-0 z-30 w-full bg-gray-850 px-4 py-2.5 sm:hidden"
  >
    <div class="flex w-full justify-between">
      <button @click="toggleHideSidebar">
        <SvgoHamburger />
      </button>

      <Web3Button />
    </div>
  </div>
</template>
