<script lang="ts" setup>
defineProps<{
  transaction: IAvocadoTransaction;
}>();
</script>

<template>
  <tr
    class="transaction-row text-sm relative cursor-pointer hidden sm:table-row"
    :class="{
      'text-slate-500': ['failed', 'dropped'].includes(transaction.status),
    }"
  >
    <td>
      <NuxtLink :to="`/tx/${transaction.hash}`" class="text-primary">
        <span> {{ shortenHash(transaction.hash) }}</span>
      </NuxtLink>
    </td>
    <td>
      <NuxtLink :to="`/tx/${transaction.hash}`" class="capitalize flex items-center">
        <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

        <span>{{ chainIdToName(transaction.chain_id) }}</span>
      </NuxtLink>
    </td>
    <td>
      <NuxtLink :to="`/tx/${transaction.hash}`" v-if="transaction.metadata.signer">
        {{ shortenHash(transaction.metadata.signer) }}
        </NuxtLink
      >
    </td>
    <td>
      <NuxtLink :to="`/tx/${transaction.hash}`" v-if="transaction.metadata.safe">
        {{ shortenHash(transaction.metadata.safe) }}</NuxtLink
      >
    </td>
    <td>
      <NuxtLink :to="`/tx/${transaction.hash}`">
        <TransactionStatus :status="transaction.status" />
      </NuxtLink>
    </td>
    <td>
      <NuxtLink class="block" :to="`/tx/${transaction.hash}`">
        <span
        v-if="transaction.fee"
        class="dark:bg-slate-750 bg-slate-200 px-2.5 py-2 text-xs rounded-5"
      >
        {{ formatUsd(transaction.fee) }}</span
      >
      <span class="text-center ml-6" v-else> - </span>
      </NuxtLink>
    </td>
    <td>
      <NuxtLink :to="`/tx/${transaction.hash}`"> {{ useTimeAgo(transaction.created_at).value }}</NuxtLink>
    </td>
  </tr>
</template>


<style scoped>
.transaction-row > td > a {
  @apply py-2 w-full inline-flex;
}

.transaction-row > td:first-child {
  @apply pl-7.5;
}

.transaction-row > td > a {
  @apply py-[18.5px] relative;
}

.transaction-row > td {
  transform-style: preserve-3d;
  white-space: nowrap;
  @apply md:pl-0 pl-4;
}

.transaction-row:hover > td::before {
  content: "";
  transform: translateZ(-1px) translateX(-50%) translateY(-50%);
  @apply absolute top-1/2 left-1/2 dark:bg-slate-800 bg-slate-150 pointer-events-none;
  width: calc(100% + 1px);
  height: calc(100% - 16px);
}

.transaction-row:hover > td:first-child:before {
  @apply rounded-l-5 ml-2.5;
}

.transaction-row:hover > td:last-child:before {
  @apply rounded-r-5;
  translate: -10px 0;
}
</style>