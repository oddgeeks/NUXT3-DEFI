<script setup></script>

<template>
  <div class="flex flex-col h-full">
    <AccountTrackingBanner />
    <div class="py-8 px-10">
      <TheHeader />
    </div>
    <WarningsGasBalance />
    <WarningsSwitchNetwork />
    <slot />
  </div>
</template>
