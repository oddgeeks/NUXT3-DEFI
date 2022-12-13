<script setup lang="ts">
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { wait } from '@instadapp/utils';

const props = defineProps<{ hash: string, chainId: number | string }>()
const provider = getRpcProvider(props.chainId)
const transaction = ref<TransactionReceipt>()

onMounted(async () => {
  await wait(5000);

  transaction.value = await provider.waitForTransaction(props.hash)
})
</script>

<template>
  <div>

    <div v-if="transaction" class="mb-8 flex justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="20" fill="#22C55E" />
        <path d="M26.6673 15L17.5007 24.1667L13.334 20" stroke="white" stroke-width="3" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </div>


    <h2 class="mb-4 text-lg">Transaction {{ transaction ? "Confirmed" : "Pending" }}</h2>

    <p v-if="!transaction" class="text-slate-400 text-xs">Transaction Broadcast</p>

    <div v-if="!transaction" class="p-24 relative">
      <div class="absolute inset-0 flex items-center justify-center">
        <svg class="animate-spin" width="60" height="60" viewBox="0 0 60 60" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_3001_8330)">
            <path
              d="M56 30C56 33.4144 55.3275 36.7953 54.0209 39.9498C52.7142 43.1042 50.7991 45.9705 48.3848 48.3848C45.9705 50.7991 43.1042 52.7142 39.9498 54.0209C36.7953 55.3275 33.4144 56 30 56C26.5856 56 23.2047 55.3275 20.0502 54.0209C16.8958 52.7142 14.0295 50.7991 11.6152 48.3848C9.2009 45.9705 7.28575 43.1042 5.97913 39.9498C4.67251 36.7953 4 33.4144 4 30"
              stroke="#4E80EE" stroke-width="8" stroke-linecap="round" />
          </g>
          <defs>
            <clipPath id="clip0_3001_8330">
              <rect width="60" height="60" fill="white" />
            </clipPath>
          </defs>
        </svg>

      </div>

      <div class="absolute inset-0 flex items-center justify-center">
        <svg class="animate-reverse-spin" width="50" height="50" viewBox="0 0 50 50" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.4596 25.0001C14.4596 23.6157 14.7323 22.2449 15.2621 20.966C15.7918 19.687 16.5683 18.5249 17.5472 17.546C18.5261 16.5671 19.6882 15.7906 20.9672 15.2609C22.2462 14.7311 23.6169 14.4584 25.0013 14.4584C26.3857 14.4584 27.7564 14.7311 29.0354 15.2609C30.3144 15.7906 31.4765 16.5671 32.4554 17.546C33.4343 18.5249 34.2108 19.687 34.7405 20.966C35.2703 22.2449 35.543 23.6157 35.543 25.0001"
            stroke="white" stroke-width="6" stroke-linecap="round" />
        </svg>

      </div>
    </div>

    <a :href="`https://socketscan.io/tx/${hash}`" target="_blank" :class="{ 'mt-8': !!transaction}"
      class="cursor-pointer bg-blue-500 hover:bg-blue-600 px-4 py-2 capitalize w-full shadow-md rounded-[15px] flex justify-center items-center space-x-2">


      View on Bridge Explorer
    </a>
  </div>
</template>
