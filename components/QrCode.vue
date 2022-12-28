<script setup>
const { safeAddress } = useAvocadoSafe();
const account = computed(() => safeAddress.value || "0x000000000000000");

const shortenAddress = () => {
  return account.value.substr(0, 6) + "..." + account.value.substr(-4);
};
</script>
<template>
  <div>
    <div
      class="py-7.5 px-5.5 bg-slate-50 dark:bg-gray-850 rounded-5.5 flex flex-col justify-center items-center"
      :class="{ blur: !safeAddress }"
    >
      <StyledQrCode
        class="rounded-5 mx-auto bg-white overflow-hidden"
        :data="account"
        :key="account"
      />

      <Copy class="mt-5" :text="account">
        <template #content>
          {{ shortenAddress() }}
        </template>
      </Copy>
      <p
        v-if="safeAddress"
        class="mt-4 text-green-400 text-xs font-semibold text-center leading-5"
      >
        Deposit any tokens on Ethereum, Polygon, Arbitrum, Optimism and
        Avalanche.
      </p>
    </div>
  </div>
</template>
