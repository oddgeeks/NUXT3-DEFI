<script setup lang="ts">
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
    <div class="flex flex-col justify-center gap-[15px] items-center">
      <div
        class="dark:bg-gray-850 bg-slate-50 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="chainId" />
        <span class="text-xs text-slate-400 leading-5">{{
          chainIdToName(chainId)
        }}</span>
      </div>
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
