<script setup>
const { safeAddress } = useAvocadoSafe();
</script>

<template>
    <div class="container flex flex-col gap-[30px] flex-1 md:pb-10">
      <TotalBalance />
      <DApps />
      <h2 class="font-semibold -mb-2.5">Balances</h2>
      <div class="flex gap-5 lg:flex-row flex-col flex-1">
        <Balances />
        <div class="flex flex-col md:basis-[213px] gap-5">
          <QrCode />
        </div>
      </div>
    </div>
</template>
