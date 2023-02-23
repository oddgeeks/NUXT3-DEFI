<script setup lang="ts">
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
const provider = getRpcProvider(634);

defineEmits(["destroy"]);

const props = defineProps({
  tx: {
    type: Object,
    required: true,
  },
  chainId: {
    type: [String, Number],
    required: true,
  },
  version: {
    type: Object,
    required: true,
  },
});

const { account } = useWeb3();
const { safe } = useAvocadoSafe();

const { data: fee, pending } = useAsyncData(
  "version-fee",
  async () => {
    const message = await safe.value?.generateSignatureMessage(
      [props.tx],
      +props.chainId
    );

    return provider.send("txn_estimateFeeWithoutSignature", [
      message,
      account.value,
      props.chainId,
    ]);
  },
  {
    server: false,
  }
);

onBeforeUnmount(() => {
  clearNuxtData("version-fee");
});
</script>

<template>
  <div class="text-center flex gap-7.5 flex-col">
    <div class="flex flex-col justify-center gap-7.5 items-center">
      <ChainLogo class="w-10 h-10" :chain="chainId" />
      <span class="text-lg leading-5"
        >{{ chainIdToName(chainId) }} Upgrade</span
      >
    </div>
    <div class="flex items-center justify-center gap-3">
      <span
        class="bg-slate-800 py-2 px-4 rounded-5 items-center justify-center flex text-sm"
      >
        v{{ version.currentVersion }}
      </span>
      <ArrowRight class="w-[18px] h-[18px] text-slate-400" />
      <span
        class="bg-slate-800 py-2 px-4 rounded-5 items-center justify-center flex text-sm"
      >
        v{{ version.latestVersion }}
      </span>
    </div>
    <EstimatedFee :chain-id="String(chainId)" :loading="pending" :data="fee" />
    <CommonButton
      :loading="pending"
      :disabled="pending"
      @click="$emit('resolve', true)"
      class="justify-center w-full"
      size="lg"
    >
      Upgrade
    </CommonButton>
  </div>
</template>
