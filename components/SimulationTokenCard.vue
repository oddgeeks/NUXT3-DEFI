<script lang="ts" setup>
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";

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
  <div
    class="dark:bg-gray-850 rounded-2xl flex justify-between items-start gap-2 py-2.5 px-[14px] bg-slate-50"
  >
    <div class="flex flex-col gap-[2px]">
      <div v-if="payload.type === 'nft'" class="flex gap-1.5 items-center">
        <img
          width="14"
          height="14"
          class="rounded-full"
          :src="payload.nftMetadata?.imageUrl"
        />
        <p class="inline leading-4">
          <span class="text-xs uppercase">
            {{ payload.nftMetadata?.name }}
          </span>
        </p>
      </div>
      <div v-else class="flex gap-1.5 items-center">
        <img v-if="token" width="14" height="14" :src="token?.logoURI" />
        <p class="inline leading-4">
          <span class="text-xs uppercase">
            {{ amount }}
            {{ token?.symbol }}
          </span>
          <span v-if="priceInUSD" class="text-xs font-normal">
            ({{ formatUsd(priceInUSD) }})
          </span>
        </p>
      </div>
      <p class="text-[10px] font-medium text-slate-400 leading-4">
        <span v-if="actualType === 'In'">
          From: {{ shortenHash(payload.from) }}</span
        >
        <span v-else> To: {{ shortenHash(payload.to) }}</span>
      </p>
    </div>
    <div
      :class="
        out ? 'bg-red-alert text-red-alert' : 'bg-green-400 text-green-400'
      "
      class="rounded-[14px] bg-opacity-10 flex items-center gap-1 w-fit px-[6px] py-[2px]"
    >
      <ArrowRight :class="out ? '-rotate-90' : 'rotate-90'" class="w-3" />
      <span class="text-[10px]">
        {{ actualType }}
      </span>
    </div>
  </div>
</template>
