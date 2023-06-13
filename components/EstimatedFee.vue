<script lang="ts" setup>
import GasSVG from '~/assets/images/icons/gas.svg?component'
import QuestionCircleSVG from '~/assets/images/icons/question-circle.svg?component'

const props = defineProps<{
  data: ICalculatedFee
  loading?: boolean
  error?: string
  wrapperClass?: string
  showNetworkInfo?: boolean
  hideErrorInfo?: boolean
  hideDiscount?: boolean
}>()

const discountAvailable = computed(() => {
  if (props.hideDiscount)
    return false

  return props.data?.discountAvailable
})
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div
      :class="wrapperClass"
      class="flex flex-col gap-3 items-center min-h-12 justify-between bg-slate-50 dark:bg-gray-850 px-5 py-[15px] rounded-5"
    >
      <div class="flex justify-between w-full">
        <span v-if="showNetworkInfo" class="text-xs flex items-center gap-3">
          <ChainLogo class="w-6 h-6" :chain="data.chainId" />
          {{ chainIdToName(data.chainId) }}
        </span>
        <span
          v-else
          class="text-xs text-slate-400 font-medium gap-2 inline-flex items-center"
        >
          <GasSVG class="w-4" />
          Gas fees
        </span>
        <span v-if="loading" class="loading-box rounded-5 w-24 h-5" />
        <template v-else-if="data">
          <span
            :class="[
              discountAvailable ? 'text-slate-400' : '',
              { 'text-red-alert': error },
            ]"
            class="text-xs inline-flex items-center gap-2.5"
          >
            <img
              v-if="!discountAvailable"
              class="w-[18px] h-[18px]"
              width="18"
              height="18"
              src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
            >
            {{ data?.formatted }} USDC
          </span>
        </template>
      </div>

      <template v-if="discountAvailable && !loading">
        <div
          v-for="detail in data.discountDetails"
          :key="detail.name"
          class="text-xs font-medium text-slate-400 leading-5 flex justify-between items-center w-full"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-base"> 🎁 </span>
            <p class="flex items-center gap-2">
              {{ detail?.name }} ({{
                formatPercent(detail?.amount, 0)
              }})

              <QuestionCircleSVG
                v-if="detail?.description"
                v-tippy="{
                  interactive: true,
                  allowHTML: true,
                  content: detail?.description,
                }"
                class="w-4 h-4 text-primary"
              />
            </p>
          </div>
          <p>
            {{
              formatDecimal(toBN(detail.discountAmount).times(-1).toFixed(), 2)
            }}
            USDC
          </p>
        </div>
        <div class="ticket-divider w-full" />
        <div class="flex justify-between w-full text-sm">
          <p>Total gas fees</p>
          <p class="inline-flex items-center gap-2">
            <img
              class="w-[18px] h-[18px]"
              width="18"
              height="18"
              src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
            >

            {{ data?.formattedAmountAfterDiscount }} USDC
          </p>
        </div>
      </template>
    </div>
    <CommonNotification v-if="error && !hideErrorInfo" type="error" :text="error">
      <template v-if="error.includes('gas')" #action>
        <CommonButton size="sm" @click="openTopUpGasModal()">
          Top-up
        </CommonButton>
      </template>
    </CommonNotification>
  </div>
</template>
