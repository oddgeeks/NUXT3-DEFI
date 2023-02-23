<script lang="ts" setup>
import { storeToRefs } from "pinia";
import GasSVG from "~/assets/images/icons/gas.svg?component";

type Data = {
  fee: string;
  multiplier: string;
};

const props = defineProps<{ data?: Data; loading?: boolean; chainId: string }>();

const { gasBalance } = storeToRefs(useSafe());

const fee = computed(() =>
  calculateEstimatedFee({ chainId: props.chainId, ...props.data })
);

const isBalaceNotEnough = computed(() => {
  if (props.loading) return false;
  return toBN(gasBalance.value).lt(fee.value?.max!);
});
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div
      class="flex items-center h-12 justify-between bg-slate-50 dark:bg-gray-850 px-5 py-[15px] rounded-5"
    >
      <span
        class="text-xs text-slate-400 font-medium gap-2 inline-flex items-center"
      >
        <GasSVG class="w-4" />
        Gas fees
      </span>
      <span class="loading-box rounded-5 w-24 h-5" v-if="loading"></span>
      <span v-else :class="{ 'text-red-alert' : isBalaceNotEnough }" class="text-xs inline-flex items-center gap-2.5">
        <img
          class="w-[18px] h-[18px]"
          width="18"
          height="18"
          src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
        />
        {{ fee.formatted }} USDC</span
      >
    </div>
    <CommonNotification
      v-if="isBalaceNotEnough"
      type="error"
      text="Not enough USDC gas"
    >
      <template #action>
        <CommonButton @click="openTopUpGasModal()" size="sm">
          Top-up
        </CommonButton>
      </template>
    </CommonNotification>
  </div>
</template>
