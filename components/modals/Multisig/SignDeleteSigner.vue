<script lang="ts" setup>
defineProps<{
  address: string
  chainId: number | string
}>()
</script>

<template>
  <div>
    <div class="flex gap-[14px] p-5 sm:p-7.5">
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-10">
          Sign Transaction
        </h1>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-gray-800">

    <div class="p-7.5">
      <MultisigSignDeleteSignerItem :address="address" :chain-id="chainId" />
    </div>
  </div>
</template>
