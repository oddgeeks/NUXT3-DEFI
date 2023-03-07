<script lang="ts" setup>
import LinkSVG from "~/assets/images/icons/external-link.svg?component";
import SVGBridge from "~/assets/images/icons/bridge.svg?component";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import { storeToRefs } from "pinia";

const props = defineProps({
  metadata: {
    type: Object,
    required: true,
  },
  transaction: Object,
});

const { fromWei } = useBignumber();

const { tokens } = storeToRefs(useTokens());

const getTokenByAddress = (
  address: string,
  chainId = props.transaction?.chain_id
) => {
  return tokens.value.find(
    (i) =>
      i.address.toLocaleLowerCase() ===
        (address && address.toLocaleLowerCase()) && i.chainId == chainId
  );
};

const token = computed(() => getTokenByAddress(props.metadata?.token));
const buyToken = computed(() => getTokenByAddress(props.metadata?.buyToken));
const sellToken = computed(() => getTokenByAddress(props.metadata?.sellToken));
const toToken = computed(() =>
  getTokenByAddress(props.metadata?.toToken, props.metadata?.toChainId)
);

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

const formatProtocol = (protocol: string) => {
  return new Map([
    ["1inch-v5", "1inch"],
    ["0x-v1", "0x"],
    ["paraswap-v5", "Paraswap"],
  ]).get(protocol);
};
</script>

<template>
  <div>
    <div class="flex gap-5" v-if="metadata.type === 'transfer' && token">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="token?.logoURI" />
      {{ formattedAmount }}
      <span class="uppercase">{{ token?.symbol }}</span>
      <ArrowRight class="w-4 h-4 text-slate-400 mx-2" />
      <a
        class="text-primary"
        :href="
          getExplorerUrl(transaction?.chain_id, `/address/${metadata.receiver}`)
        "
        >{{ shortenHash(metadata.receiver) }}</a
      >
    </span>
  </div>
  <div class="flex gap-5" v-if="metadata.type === 'gas-topup' && token">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="token?.logoURI" />
      {{ formattedAmount }}
      <span class="uppercase">{{ token?.symbol }}</span>
      <GasSVG class="w-4 h-4 text-slate-400 mx-2" />
      <span>{{ shortenHash(metadata.onBehalf) }}</span>
    </span>
  </div>
  <div class="flex gap-5" v-if="metadata.type === 'swap' && sellToken && buyToken">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="sellToken?.logoURI" />
      {{ sellAmountFormatted }}
      <span class="uppercase">{{ sellToken?.symbol }}</span>
      <RefreshSVG class="w-4 h-4 text-slate-400 mx-2" />
      <img width="20" height="20" class="w-5 h-5" :src="buyToken?.logoURI" />
      {{ buyAmountFormatted }}
      <span class="uppercase">{{ buyToken?.symbol }}</span>
      <span
        class="capitalize flex items-center gap-2.5"
        v-if="metadata.protocol"
      >
        On <ProtocolLogo class="w-5 h-5" :name="metadata.protocol" />
        {{ formatProtocol(metadata.protocol) }}
      </span>
    </span>
  </div>
  <div class="flex gap-5 items-center" v-if="metadata.type === 'bridge' && toToken">
    <span class="capitalize text-sm">{{ metadata.type }}</span>
    <span class="inline-flex gap-2.5 items-center">
      <img width="20" height="20" class="w-5 h-5" :src="toToken.logoURI" />
      {{ bridgeAmountFormatted }}
      <span class="uppercase">{{ toToken?.symbol }}</span>
      <SVGBridge class="text-slate-400 w-5 h-5" />
      <span class="flex items-center gap-2.5">
        <ChainLogo class="w-5" :chain="metadata.toChainId" />
        <span>{{ chainIdToName(metadata.toChainId) }}</span>
      </span>
    </span>
  </div>
  <div v-if="metadata.type === 'upgrade'" class="self-start">
    Wallet upgraded to {{ metadata?.version }}
  </div>
  <div v-if="metadata.type === 'dapp'" class="self-start flex items-center gap-2 text-primary">
   <a :href="metadata?.url" target="_blank" rel="noopener noreferrer">{{ metadata?.name }}</a>
   <LinkSVG />
  </div>
  <div v-if="metadata.type === 'deploy'" class="self-start capitalize">
     {{ metadata?.type }}
  </div>
   <div v-if="metadata.type === 'wc-sign'" class="self-start capitalize">
     WalletConnect Sign
  </div>
  </div>
</template>
