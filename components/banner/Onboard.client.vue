<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import WaveSVG from "~/assets/images/icons/wave.svg?component";
import { IBalance } from "~~/stores/safe";

const { hideOnboardBanner } = useBanner();
const { account } = useWeb3();
const { getBalances } = useSafe();

const balances = ref<IBalance[]>([]);

const totalWithBalance = computed(() =>
  balances.value.filter((el) => toBN(el.balance).decimalPlaces(5).gt(0))
);
const totalUSD = computed(() =>
  totalWithBalance.value.reduce(
    (sum, cur) => sum.plus(cur.balanceInUSD || "0"),
    toBN(0)
  )
);
const totalChains = computed(
  () => new Set(totalWithBalance.value.map((el) => el.chainId)).size
);

watch(
  account,
  async () => {
    if (!account.value) return;
    const data = await getBalances(account.value);

    balances.value = data.flat() as IBalance[];
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="w-full max-w-[832px] mx-auto text-xs relative bg-[#4CA054] bg-opacity-60 py-[15px] px-5 sm:rounded-5 backdrop-blur shrink-0 flex flex-col sm:flex-row justify-between items-center gap-[15px]"
    v-if="balances.length > 0"
  >
    <div class="flex space-x-[25px] items-start sm:items-center">
      <WaveSVG class="w-8 h-8" />
      <p class="leading-5 w-5/6 sm:w-fit">
        Welcome to Avocado 🥑 You have ${{ totalUSD.toFormat(2) }} of assets
        spread across {{ totalChains }} networks on your wallet (EOA). Import
        the assets to your Avocado wallet to begin transacting.
      </p>
    </div>
    <div class="flex space-x-5 items-center w-full sm:w-fit">
      <CommonButton
        as="NuxtLink"
        :href="avoOnboardURL"
        target="_blank"
        size="sm"
        class="w-full sm:w-fit h-7.5 sm:h-fit justify-center"
      >
        Import
      </CommonButton>
      <button
        @click="hideOnboardBanner()"
        class="w-5 h-5 rounded-full flex items-center justify-center bg-white bg-opacity-20"
      >
        <SVGX class="dark:text-white text-slate-500" />
      </button>
    </div>
  </div>
</template>
