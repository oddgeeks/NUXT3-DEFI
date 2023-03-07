<script setup lang="ts">
const { getNetworkByChainId } = useNetworks();

const props = defineProps<{
  transaction: IAvocadoTransaction;
}>();

const chain = computed(() => getNetworkByChainId(props.transaction.chain_id));
</script>

<template>
  <NuxtLink class="py-3.5 px-4.5 gap-[14px] bg-slate-50 dark:bg-gray-850 rounded-5 flex flex-col" :class="{
    'text-slate-500': ['failed', 'dropped'].includes(transaction.status),
  }" :to="`/tx/${transaction.hash}`">
    <div class="flex justify-between items-start">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3 text-xs">
          <span class="text-slate-400 font-semibold">TX #</span>
          <span class="text-primary" :class="{
            'text-slate-500': ['failed', 'dropped'].includes(transaction.status),
          }"> {{ shortenHash(transaction.hash) }}</span>
        </div>

        <div class="flex items-center gap-3 text-xs">
          <span class="text-slate-400 font-semibold">Signer</span>
          <span v-if="transaction.metadata.signer"> {{ shortenHash(transaction.metadata.signer) }}</span>
        </div>

        <div class="flex items-center gap-3 text-xs">
          <span class="text-slate-400 font-semibold">AvoSafe</span>
          <span v-if="transaction.metadata.safe"> {{ shortenHash(transaction.metadata.safe) }}</span>
        </div>
      </div>
      <div class="flex items-start justify-between">
        <TransactionStatus :status="transaction.status" :hideText="true" />
      </div>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex gap-[14px]">
        <div class="flex items-center gap-2.5 py-2 px-2.5 bg-slate-150 dark:bg-slate-800 rounded-xl">
          <ChainLogo class="w-5 h-5" :chain="transaction.chain_id" />
          <span class="text-xs">{{ chain.name }}</span>
        </div>

        <div class="flex items-center text-xs gap-2.5 py-2 px-2.5 bg-slate-150 dark:bg-slate-800 rounded-xl"
          v-if="transaction.fee">
          <span class="text-slate-400">Fee: </span>
          <span>{{ formatUsd(transaction.fee) }}</span>
        </div>
      </div>
      <span class="text-slate-400 text-xs">{{ useTimeAgo(transaction.created_at).value }}</span>
    </div>
  </NuxtLink>
</template>