<script setup lang="ts">
definePageMeta({
  layout: "auth",
});
</script>
<template>
  <div
    class="sm:w-[460px] w-full h-full mx-auto mt-[92px] py-10 sm:px-[50px] px-5 rounded-[30px] dark:bg-gray-850 bg-white"
  >
    <div class="w-full flex justify-center">
      <SvgAvocadoLogo />
    </div>
    <h1 class="mt-5 text-2xl leading-10 font-semibold text-center">
      Connect to Avocado
    </h1>
    <p class="mt-2.5 text-xs leading-6 font-medium text-center text-slate-400">
      And enjoy the most user friendly web3 experience
    </p>
    <div class="mt-[30px]">
      <Web3Connectors />
    </div>
  </div>
</template>
