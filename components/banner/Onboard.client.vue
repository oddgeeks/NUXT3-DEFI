<script setup>
import SVGX from "~/assets/images/icons/x.svg?component";
import WaveSVG from "~/assets/images/icons/wave.svg?component";

const { hideOnboardBanner } = useBanner();
const { account } = useWeb3();
const { tokens } = useTokens();

const balances = ref([]);

const totalWithBalance = computed(() => balances.value.filter(el => toBN(el.balance).decimalPlaces(5).gt(0)));
const totalUSD = computed(() => totalWithBalance.value.reduce((sum, cur) => sum += parseFloat(cur.balanceInUSD), 0));
const totalChains = computed(() => new Set(totalWithBalance.value.map(el => el.chainId)).size);

watch(account, async () => {
  const res = await $fetch("/api/balances", {
    params: {
      address: account.value,
    },
  });
  balances.value = res.filter(el => tokens.some(t => t.address === el.address));
}, { immediate: true });
</script>
<template>
  <div class="fixed bottom-12 w-full z-40">
    <div
      class="w-full max-w-[832px] mx-auto text-xs relative bg-[#16A34A] py-2 px-6 rounded-5 backdrop-blur bg-opacity-20 shrink-0 flex justify-between items-center gap-[15px]"
      v-if="balances.length > 0"  
    >
      <div class="flex space-x-[25px] items-center">
        <WaveSVG class="w-12 h-12" />
        <p class="text-green-400">
          Welcome to Avocado 🥑 You have ${{ totalUSD.toFixed(2) }} of assets spread across {{ totalChains }} networks on your wallet (EOA). Import the assets
          to your Avocado wallet to begin transacting.
        </p>
      </div>
      <div class="flex space-x-5 items-center">
        <CommonButton as="NuxtLink" href="https://onboard.avocado.instadapp.io/" target="_blank" size="sm">
          Import
        </CommonButton>
        <button @click="hideOnboardBanner()">
          <SVGX class="text-slate-500" />
        </button>
      </div>
    </div>
  </div>
</template>
