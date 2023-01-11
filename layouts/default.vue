<script setup>
const { trackingAccount } = useAccountTrack()
</script>

<template>
  <div class="flex flex-col h-full">
    <AccountTrackingBanner v-if="trackingAccount" />
    <div class="py-8 px-10">
      <TheHeader />
    </div>
    <WarningsGasBalance />
    <WarningsSwitchNetwork />
    <slot />
  </div>
</template>
