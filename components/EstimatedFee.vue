<script lang="ts" setup>
import GasSVG from "~/assets/images/icons/gas.svg?component";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";

const props = defineProps<{
  data: ICalculatedFee;
  loading?: boolean;
  error?: string;
  wrapperClass?: string;
}>();

const { formatPercent } = useFormatter();

const discountAvailable = computed(() =>
  toBN(props.data?.discountAmount).gt(0)
);
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div
      :class="wrapperClass"
      class="flex flex-col gap-3 items-center min-h-12 justify-between bg-slate-50 dark:bg-gray-850 px-5 py-[15px] rounded-5"
    >
      <div class="flex justify-between w-full">
        <span
          class="text-xs text-slate-400 font-medium gap-2 inline-flex items-center"
        >
          <GasSVG class="w-4" />
          Gas fees
        </span>
        <span class="loading-box rounded-5 w-24 h-5" v-if="loading"></span>
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
            />
            {{ data?.formatted }} USDC
          </span>
        </template>
      </div>
      <template v-if="discountAvailable && !loading">
        <div
          class="text-xs font-medium text-slate-400 leading-5 flex justify-between items-center w-full"
        >
          <div class="flex items-center gap-1.5">
            <img
              class="w-[18px] h-[18px]"
              width="18"
              height="18"
              :src="data.discountDetails?.iconURL"
            />
            <p class="flex items-center gap-2">
              {{ data.discountDetails?.name }} ({{
                formatPercent(data.discountDetails?.discount, 0)
              }})

              <QuestionCircleSVG
                :content="data.discountDetails?.tooltip"
                v-tippy="{
                  interactive: true,
                  allowHTML: true,
                }"
                class="w-4 h-4 text-primary"
              />
            </p>
          </div>
          <p>
            {{ formatDecimal(toBN(data.discountAmount).times(-1).toFixed()) }}
            USDC
          </p>
        </div>
        <div class="ticket-divider w-full"></div>
        <div class="flex justify-between w-full text-sm">
          <p>Total gas fees</p>
          <p class="inline-flex items-center gap-2">
            <img
              class="w-[18px] h-[18px]"
              width="18"
              height="18"
              src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
            />
            {{ formatDecimal(data?.amountAfterDiscount) }} USDC
          </p>
        </div>
      </template>
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
