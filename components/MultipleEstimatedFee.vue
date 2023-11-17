<script setup lang="ts">
defineProps<{
  data: ICalculatedFee[]
  totalAmountAfterDiscount: string
  loading?: boolean
  error?: string
}>()
</script>

<template>
  <ul class="flex flex-col gap-4 rounded-2xl bg-slate-50 py-[14px] dark:bg-gray-850">
    <li v-for="item in data" :key="item.chainId" class="flex items-center justify-between px-4 font-medium">
      <div class="flex items-center gap-2.5 text-xs">
        <ChainLogo class="h-4.5 w-4.5" :chain="item.chainId" />
        {{ chainIdToName(item.chainId) }}
      </div>
      <p class="inline-flex items-center gap-2 text-xs font-medium">
        <img
          class="h-[18px] w-[18px]"
          width="18"
          height="18"
          src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
        >

        {{ item?.formattedAmountAfterDiscount }} USDC
      </p>
    </li>
    <li class="border-t border-slate-150 px-4 pt-3 dark:border-slate-800">
      <div class="flex w-full justify-between">
        <p class="flex items-center gap-2.5">
          <SvgoGas class="text-slate-400" />
          Total gas fees
        </p>
        <p class="inline-flex items-center gap-2">
          <img
            class="h-[18px] w-[18px]"
            width="18"
            height="18"
            src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
          >

          {{ formatDecimal(totalAmountAfterDiscount) }} USDC
        </p>
      </div>
    </li>
    <li class="px-4">
      <CommonNotification v-if="error" type="error" :text="error">
        <template v-if="error.includes('gas')" #action>
          <CommonButton class="whitespace-nowrap" size="sm" @click="openTopUpGasModal()">
            Top-up
          </CommonButton>
        </template>
      </CommonNotification>
    </li>
  </ul>
</template>
