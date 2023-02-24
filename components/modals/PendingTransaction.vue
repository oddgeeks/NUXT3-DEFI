<script setup lang="ts">
import SVGBridge from "~/assets/images/icons/bridge-2.svg?component";
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { wait } from "@instadapp/utils";

const encodedEvent = '0xacb5341cc21d71a005bd22634cec7391a7fd11ff2b563a7b301cac795f7a6a56'

const props = defineProps<{
  hash: string;
  chainId: number | string;
  type: ITxType;
}>();
const provider = getRpcProvider(props.chainId);
const transaction = ref<TransactionReceipt>();

onMounted(async () => {
  await wait(5000);

  transaction.value = await provider.waitForTransaction(props.hash);
});

const isSuccess = computed(() => {
  if (!transaction.value?.status) return false;

  if (transaction.value.logs.some(i => i.topics.length && i.topics[0] === encodedEvent)) return true;

  return false;
})

</script>

<template>
  <div class="text-center flex flex-col gap-7.5">
    <div v-if="transaction" class="flex justify-center">
      <SVGCheckCircle
        v-if="isSuccess"
        class="text-white w-10 h-10 success-circle"
      />

      <svg
        v-else
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="20" fill="#EB5757" />
        <path
          d="M25 15L15 25"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M15 15L25 25"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <div v-if="!transaction" class="flex justify-center">
      <svg
        class="animate-spin h-10 w-10 text-green-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          stroke-linecap="round"
        ></path>
      </svg>
    </div>

    <div>
      <h2 class="text-lg leading-5">
        Transaction
        {{
          transaction
            ? isSuccess
              ? "Confirmed"
              : "Failed"
            : "Pending"
        }}
      </h2>

      <p v-if="!transaction" class="text-slate-400 text-xs leading-5 mt-2">
        The transaction has been sent to be processed.
      </p>

      <p
        v-if="transaction && !isSuccess"
        class="text-slate-400 text-xs mt-2"
      >
        Try again or return to the home page.
      </p>
    </div>

    <div
      class="dark:bg-slate-800 bg-slate-100 bg px-[18px] py-[14px] rounded-5 flex items-center justify-between"
    >
      <p v-if="type === 'bridge'" class="flex gap-3 items-center">
        <div class="bg-primary items-center justify-center flex rounded-full w-[26px] h-[26px]">
          <SVGBridge class="w-4" />
        </div>
        <span class="text-sm text-slate-400 font-medium">Bridge</span>
      </p>
      <p v-else class="flex gap-3 items-center">
        <ChainLogo class="w-[26px] h-[26px]" :chain="chainId" />
        <span class="text-sm text-slate-400">{{ chainIdToName(chainId) }}</span>
      </p>
      <CommonButton as="a" :href="`/tx/${hash}`" size="sm">
        View Explorer
      </CommonButton>
    </div>
  </div>
</template>
