<script lang="ts" setup>
import GasSVG from "~/assets/images/icons/gas.svg?component";

defineProps<{
  data: any;
  loading?: boolean;
  error?: string;
}>();
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
      <span
        v-else-if="data"
        :class="{ 'text-red-alert': error }"
        class="text-xs inline-flex items-center gap-2.5"
      >
        <img
          class="w-[18px] h-[18px]"
          width="18"
          height="18"
          src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
        />
        {{ data?.formatted }} USDC</span
      >
    </div>
    <CommonNotification v-if="error" type="error" :text="error">
      <template v-if="error.includes('gas')" #action>
        <CommonButton @click="openTopUpGasModal()" size="sm">
          Top-up
        </CommonButton>
      </template>
    </CommonNotification>
  </div>
</template>
