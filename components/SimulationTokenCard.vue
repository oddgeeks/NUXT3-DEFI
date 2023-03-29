<script lang="ts" setup>
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import SVGInfoCircle from "~/assets/images/icons/exclamation-circle.svg?component";

const props = defineProps<{
  payload: SimulationToken;
  type: "approve" | "recieve" | "send";
  chainId: string;
}>();

const { getTokenByAddress, fetchTokenByAddress } = useTokens();
const { fromWei } = useBignumber();

const token = asyncComputed(async () => {
  const token = getTokenByAddress(props.payload.token, props.chainId);

  if (token) return token;

  const tokens =
    (await fetchTokenByAddress([props.payload.token], props.chainId)) || [];
  return tokens[0];
});

const amount = computed(() => {
  if (props.payload.amount.startsWith("115792089237316195423570985008687"))
    return "∞";

  return fromWei(props.payload.amount, token.value?.decimals).decimalPlaces(5);
});

const priceInUSD = computed(() => {
  if (!token.value || amount.value === "∞") return;

  return times(amount.value, token.value?.price || 0).toFixed();
});

const actualType = computed(() => {
  switch (props.type) {
    case "approve":
      return "Approve";
    case "recieve":
      return "In";
    case "send":
      return "Out";
  }
});

const out = computed(() => {
  return props.type === "send" || props.type === "approve";
});
</script>

<template>
  <li
    :class="{ hidden: !token && payload.type !== 'NFT' }"
    class="dark:bg-gray-850 rounded-2xl flex flex-col justify-between items-start gap-2 py-2.5 px-3 bg-slate-50"
  >
    <div class="flex gap-2 justify-between w-full">
      <div
        v-if="payload.type === 'NFT'"
        class="flex gap-1.5 items-center flex-1"
      >
        <img width="26" height="26" :src="payload.nftMetadata?.imageUrl" />
        <p class="inline leading-4 text-xs uppercase">
          {{ payload.nftMetadata?.name }}
        </p>
      </div>
      <div v-else class="flex gap-1.5 items-center">
        <img
          v-if="token?.logoURI"
          width="26"
          height="26"
          :src="token?.logoURI"
        />
        <p class="flex flex-col">
          <span class="text-xs uppercase leading-4">
            {{ amount }}
            {{ token?.symbol }}
          </span>
          <span
            v-if="priceInUSD"
            class="text-[10px] text-slate-400 leading-4 font-medium"
          >
            {{ formatUsd(priceInUSD) }}
          </span>
        </p>
      </div>
      <div
        :class="out ? 'text-red-alert' : 'text-green-400'"
        class="rounded-[14px] flex items-center gap-1 w-fit h-4"
      >
        <ArrowRight
          :class="out ? '-rotate-90' : 'rotate-90'"
          class="w-3 [&>path]:stroke-[3px]"
        />
        <span class="text-[10px] leading-4">
          {{ actualType }}
        </span>
      </div>
    </div>
    <div class="flex justify-between w-full">
      <div
        class="text-[10px] font-medium w-fit text-slate-400 dark:bg-slate-800 py-1 px-2.5 bg-slate-150 rounded-10"
      >
        <span class="leading-4" v-if="actualType === 'In'">
          From: {{ shortenHash(payload.from) }}</span
        >
        <span class="leading-4" v-else> To: {{ shortenHash(payload.to) }}</span>
      </div>
      <div
        v-if="payload.type"
        class="text-[10px] flex items-center gap-[7px] font-medium w-fit text-slate-400 dark:bg-slate-800 py-1 px-2.5 bg-slate-150 rounded-10"
      >
        {{ payload.type }}
        <SVGInfoCircle
          v-if="payload.type === 'Flashloan'"
          v-tippy="
            'This transfer involves taking a flashloan using the Instadapp Flashloan Aggregator'
          "
          class="text-primary w-3"
        />
      </div>
    </div>
  </li>
</template>
