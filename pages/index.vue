<script setup>
const { safeAddress } = useAvocadoSafe();
</script>

<template>
  <div class="container flex flex-col gap-[30px]">
      <TotalBalance />
      <DApps />
      <div class="flex gap-5 lg:flex-row flex-col">
        <Balances class="mb-5 md:mb-0 md:pb-14 flex-1" />
        <div class="flex flex-col md:basis-[213px] gap-5">
          <QrCode />
        </div>
      </div>
    </div>
</template>
