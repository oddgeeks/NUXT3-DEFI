<script setup>
const { safeAddress } = useAvocadoSafe()
const account = computed(() => safeAddress.value || '0x000000000000000')
</script>

<template>
  <div
    class="relative flex w-[420px] flex-col items-center gap-4"
    :class="{ 'pointer-events-none blur': !safeAddress }"
  >
    <StyledQrCode
      :key="account"
      class="mt-5 overflow-hidden rounded-10 bg-white"
      :size="420"
      :margin="20"
      :data="account"
    />

    <div class="relative flex w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-7.5 bg-gray-850 p-4">
      <span class="text-sm text-gray-500">Your Avocado Address</span>
      <Copy :text="account" class="w-full justify-center">
        <template #content>
          <span class="text-[14px] ">{{ account }}</span>
        </template>
      </Copy>
    </div>
  </div>
</template>
