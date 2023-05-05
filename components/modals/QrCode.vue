<script setup>
const { safeAddress } = useAvocadoSafe()
const account = computed(() => safeAddress.value || '0x000000000000000')
</script>

<template>
  <div
    class="relative flex flex-col items-center gap-4 w-[420px]"
    :class="{ 'blur pointer-events-none': !safeAddress }"
  >
    <StyledQrCode
      :key="account"
      class="rounded-10 mt-5 bg-white overflow-hidden"
      :size="420"
      :margin="20"
      :data="account"
    />

    <div class="relative bg-slate-50 dark:bg-gray-850 rounded-7.5 flex flex-col justify-center items-center gap-2.5 px-4 py-4 overflow-hidden w-full">
      <span class="text-sm dark:text-slate-500 text-slate-400">Your Avocado Address</span>
      <Copy :text="account" class="w-full justify-center">
        <template #content>
          <span class="dark:text-white text-slate-900 text-[14px]">{{ account }}</span>
        </template>
      </Copy>
    </div>
  </div>
</template>
