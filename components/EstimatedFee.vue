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
      class="min-h-12 flex flex-col items-center justify-between gap-3 rounded-5  bg-gray-850 px-5 py-[15px]"
    >
      <div class="flex w-full justify-between">
        <span v-if="showNetworkInfo" class="flex items-center gap-3 text-xs">
          <ChainLogo class="h-6 w-6" :chain="data.chainId" />
          {{ chainIdToName(data.chainId) }}
        </span>
        <span
          v-else
          class="inline-flex items-center gap-2 text-xs font-medium text-gray-400"
        >
          <GasSVG class="w-4" />
          Gas fees
        </span>
        <span v-if="loading" class="loading-box h-5 w-24 rounded-5" />
        <template v-else-if="data">
          <span
            :class="[
              discountAvailable ? 'text-gray-400' : '',
              { 'text-red-alert': error },
            ]"
            class="inline-flex items-center gap-2.5 text-xs"
          >
            <img
              v-if="!discountAvailable"
              class="h-[18px] w-[18px]"
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
          class="flex w-full items-center justify-between text-xs font-medium leading-5 text-gray-400"
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
                class="h-4 w-4 text-primary"
              />
            </p>
          </div>
          <p>
            {{ detail.formattedDiscountAmount }}
            USDC
          </p>
        </div>
        <div class="ticket-divider w-full" />
        <div class="flex w-full justify-between text-sm">
          <p>Total gas fees</p>
          <p class="inline-flex items-center gap-2">
            <img
              class="h-[18px] w-[18px]"
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
        <CommonButton class="whitespace-nowrap" size="sm" @click="openTopUpGasModal()">
          Top-up
        </CommonButton>
      </template>
    </CommonNotification>
  </div>
</template>
