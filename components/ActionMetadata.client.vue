<script lang="ts" setup>
import SVGBridge from "~/assets/images/icons/bridge.svg?component";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import { storeToRefs } from "pinia";
const { tokens } = storeToRefs(useTokens());

const props = defineProps({
  metadata: {
    type: Object,
    required: true,
  },
});

const { fromWei } = useBignumber();

const getTokenByAddress = (address: string) => {
  return tokens.value.find(
    (i) =>
      i.address.toLocaleLowerCase() === (address && address.toLocaleLowerCase())
  );
};

const token = computed(() => getTokenByAddress(props.metadata?.token));
const buyToken = computed(() => getTokenByAddress(props.metadata?.buyToken));
const sellToken = computed(() => getTokenByAddress(props.metadata?.sellToken));
const toToken = computed(() => getTokenByAddress(props.metadata?.toToken));

const sellAmountFormatted = computed(() =>
  formatDecimal(
    fromWei(props.metadata?.sellAmount, sellToken?.value?.decimals).toFixed()
  )
);

const buyAmountFormatted = computed(() =>
  formatDecimal(
    fromWei(props.metadata?.buyAmount, buyToken?.value?.decimals).toFixed()
  )
);

const formattedAmount = computed(() =>
  formatDecimal(
    fromWei(props.metadata?.amount, token?.value?.decimals).toFixed()
  )
);

const bridgeAmountFormatted = computed(() =>
  formatDecimal(
    fromWei(props.metadata?.amount, toToken?.value?.decimals).toFixed()
  )
);


</script>

<template>
  <div class="flex gap-5" v-if="metadata.type === 'transfer'">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="token?.logoURI" />
      {{ formattedAmount }}
      <span class="uppercase">{{ token?.symbol }}</span>
      <ArrowRight class="w-4 h-4 text-slate-400 mx-2" />
      <span>{{ shortenHash(metadata.receiver) }}</span>
    </span>
  </div>
  <div class="flex gap-5" v-if="metadata.type === 'gas-topup'">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="token?.logoURI" />
      {{ formattedAmount }}
      <span class="uppercase">{{ token?.symbol }}</span>
      <GasSVG class="w-4 h-4 text-slate-400 mx-2" />
      <span>{{ shortenHash(metadata.onBehalf) }}</span>
    </span>
  </div>
  <div class="flex gap-5" v-if="metadata.type === 'swap'">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="sellToken?.logoURI" />
      {{ sellAmountFormatted }}
      <span class="uppercase">{{ sellToken?.symbol }}</span>
      <RefreshSVG class="w-4 h-4 text-slate-400 mx-2" />
      <img width="20" height="20" class="w-5 h-5" :src="buyToken?.logoURI" />
      {{ buyAmountFormatted }}
      <span class="uppercase">{{ buyToken?.symbol }}</span>
      <span class="capitalize flex items-center gap-2.5" v-if="metadata.protocol">
        <ProtocolLogo class="w-5 h-5" :name="metadata.protocol"/>
        On {{  metadata.protocol }}
      </span>
    </span>
  </div>
  <div class="flex gap-5 items-center" v-if="metadata.type === 'bridge'">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="toToken?.logoURI" />
      {{ bridgeAmountFormatted }}
      <span class="uppercase">{{ toToken?.symbol }}</span>
      <SVGBridge class="text-slate-400 w-5 h-5" />
      <span class="flex items-center gap-2.5">
        <ChainLogo class="w-5" :chain="metadata.toChainId" />
        <span>{{ chainIdToName(metadata.toChainId) }}</span>
      </span>
    </span>
  </div>
</template>
