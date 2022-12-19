<script setup>
const { safeAddress } = useAvocadoSafe();
</script>

<template>
  <div class="container">
    <div>
      <TotalBalance />
      <DApps />
    </div>

    <div class="flex gap-5 lg:flex-row flex-col">
      <Balances class="mb-5 md:mb-0 md:pb-14 flex-1" />

      <div class="flex flex-col md:basis-[213px] gap-5">
        <QrCode />
        <WalletConnect />
      </div>
    </div>
  </div>
</template>
